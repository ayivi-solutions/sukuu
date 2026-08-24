import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';


const BASE32 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';


function encryptionKey(): Buffer {

  const raw =
    process.env.MFA_ENCRYPTION_KEY;


  if (!raw) {

    throw new Error(
      'MFA_ENCRYPTION_KEY is required'
    );

  }


  const key =
    Buffer.from(
      raw,
      'base64'
    );


  if (key.length !== 32) {

    throw new Error(
      'MFA_ENCRYPTION_KEY must decode to exactly 32 bytes'
    );

  }


  return key;

}


export function base32Encode(
  input: Buffer
): string {

  let bits = 0;
  let value = 0;
  let output = '';


  for (const byte of input) {

    value =
      (value << 8) |
      byte;

    bits += 8;


    while (bits >= 5) {

      output +=
        BASE32[
          (value >> (bits - 5)) &
          31
        ];

      bits -= 5;

    }

  }


  if (bits > 0) {

    output +=
      BASE32[
        (value << (5 - bits)) &
        31
      ];

  }


  return output;

}


export function base32Decode(
  input: string
): Buffer {

  const normalized =
    input
      .trim()
      .replace(/=+$/g, '')
      .replace(/\s+/g, '')
      .toUpperCase();


  let bits = 0;
  let value = 0;

  const bytes: number[] = [];


  for (
    const character
    of normalized
  ) {

    const index =
      BASE32.indexOf(
        character
      );


    if (index < 0) {

      throw new Error(
        'Invalid TOTP secret'
      );

    }


    value =
      (value << 5) |
      index;

    bits += 5;


    if (bits >= 8) {

      bytes.push(
        (value >> (bits - 8)) &
        255
      );

      bits -= 8;

    }

  }


  return Buffer.from(
    bytes
  );

}


export function generateTotpSecret(): string {

  return base32Encode(
    randomBytes(20)
  );

}


export function encryptTotpSecret(
  secret: string
): string {

  const iv =
    randomBytes(12);


  const cipher =
    createCipheriv(
      'aes-256-gcm',
      encryptionKey(),
      iv
    );


  const ciphertext =
    Buffer.concat([
      cipher.update(
        secret,
        'utf8'
      ),
      cipher.final(),
    ]);


  const tag =
    cipher.getAuthTag();


  return JSON.stringify({
    v: 1,
    alg: 'A256GCM',
    iv:
      iv.toString(
        'base64'
      ),
    tag:
      tag.toString(
        'base64'
      ),
    data:
      ciphertext.toString(
        'base64'
      ),
  });

}


export function decryptTotpSecret(
  envelope: string
): string {

  const parsed =
    JSON.parse(
      envelope
    );


  if (
    parsed?.v !== 1 ||
    parsed?.alg !== 'A256GCM'
  ) {

    throw new Error(
      'Unsupported MFA secret envelope'
    );

  }


  const decipher =
    createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      Buffer.from(
        parsed.iv,
        'base64'
      )
    );


  decipher.setAuthTag(
    Buffer.from(
      parsed.tag,
      'base64'
    )
  );


  return Buffer.concat([
    decipher.update(
      Buffer.from(
        parsed.data,
        'base64'
      )
    ),
    decipher.final(),
  ])
    .toString(
      'utf8'
    );

}


function totpCode(
  secret: string,
  counter: number
): string {

  const key =
    base32Decode(
      secret
    );


  const counterBuffer =
    Buffer.alloc(8);


  counterBuffer.writeBigUInt64BE(
    BigInt(counter)
  );


  const digest =
    createHmac(
      'sha1',
      key
    )
      .update(
        counterBuffer
      )
      .digest();


  const offset =
    digest[
      digest.length - 1
    ] & 0x0f;


  const value =
    (
      digest.readUInt32BE(
        offset
      ) &
      0x7fffffff
    ) %
    1_000_000;


  return String(value)
    .padStart(
      6,
      '0'
    );

}


export function verifyTotp(
  secret: string,
  candidate: string,
  now = Date.now()
): number | null {

  if (
    !/^\d{6}$/.test(
      candidate
    )
  ) {

    return null;

  }


  const currentCounter =
    Math.floor(
      now /
      1000 /
      30
    );


  for (
    const delta
    of [-1, 0, 1]
  ) {

    const counter =
      currentCounter +
      delta;


    const expected =
      totpCode(
        secret,
        counter
      );


    const expectedBuffer =
      Buffer.from(
        expected
      );


    const candidateBuffer =
      Buffer.from(
        candidate
      );


    if (
      expectedBuffer.length ===
        candidateBuffer.length &&
      timingSafeEqual(
        expectedBuffer,
        candidateBuffer
      )
    ) {

      return counter;

    }

  }


  return null;

}


export function buildOtpAuthUri(
  email: string,
  secret: string
): string {

  const issuer =
    'Sukuu ERP';


  const label =
    `${issuer}:${email}`;


  return (
    `otpauth://totp/${encodeURIComponent(label)}` +
    `?secret=${encodeURIComponent(secret)}` +
    `&issuer=${encodeURIComponent(issuer)}` +
    '&algorithm=SHA1&digits=6&period=30'
  );

}
