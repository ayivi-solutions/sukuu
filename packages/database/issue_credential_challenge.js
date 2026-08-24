const {
  PrismaClient,
} = require('@prisma/client');

const bcrypt =
  require('bcryptjs');

const {
  createHash,
  randomBytes,
} = require('crypto');

const fs =
  require('fs');

const path =
  require('path');


const prisma =
  new PrismaClient();


function required(name) {

  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} is required`
    );
  }

  return value;
}


async function main() {

  const email =
    required(
      'TARGET_USER_EMAIL'
    )
      .trim()
      .toLowerCase();


  const tokenFile =
    required(
      'CREDENTIAL_TOKEN_FILE'
    );


  const purpose =
    (
      process.env.CREDENTIAL_PURPOSE ||
      'COMPROMISED_ROTATION'
    )
      .trim()
      .toUpperCase();


  const validPurposes =
    new Set([
      'FIRST_CREDENTIAL',
      'PASSWORD_RESET',
      'COMPROMISED_ROTATION',
    ]);


  if (
    !validPurposes.has(
      purpose
    )
  ) {
    throw new Error(
      'Unsupported CREDENTIAL_PURPOSE'
    );
  }


  const ttlMinutes =
    Number(
      process.env.CREDENTIAL_TTL_MINUTES ||
      '30'
    );


  if (
    !Number.isInteger(ttlMinutes) ||
    ttlMinutes < 5 ||
    ttlMinutes > 1440
  ) {
    throw new Error(
      'CREDENTIAL_TTL_MINUTES must be between 5 and 1440'
    );
  }


  const issuedBy =
    (
      process.env.CREDENTIAL_ISSUED_BY ||
      'controlled-operator'
    )
      .trim();


  const identity =
    await prisma.$queryRawUnsafe(
      `
      SELECT
        current_user::text AS role
      `
    );


  if (
    identity[0]?.role !==
    'postgres'
  ) {
    throw new Error(
      'Credential challenge issuance requires the controlled postgres administrative connection.'
    );
  }


  const user =
    await prisma.systemUser.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        archived_at: null,
      },
    });


  if (!user) {
    throw new Error(
      'Target user was not found.'
    );
  }


  if (
    user.status === 'CLOSED' ||
    user.status === 'SUSPENDED'
  ) {
    throw new Error(
      'Target account is not eligible for credential issuance.'
    );
  }


  const grants =
    await prisma.systemUserRole.findMany({
      where: {
        user_id: user.id,
        OR: [
          {
            expires_at: null,
          },
          {
            expires_at: {
              gt: new Date(),
            },
          },
        ],
      },
      select: {
        school_id: true,
      },
    });


  const schoolIds =
    [
      ...new Set(
        grants
          .map(
            grant =>
              grant.school_id
          )
          .filter(Boolean)
      ),
    ];


  if (
    schoolIds.length !== 1
  ) {
    throw new Error(
      'Target account must resolve to exactly one active tenant before credential issuance.'
    );
  }


  const schoolId =
    schoolIds[0];


  const token =
    randomBytes(32)
      .toString('base64url');


  const tokenHash =
    createHash('sha256')
      .update(token)
      .digest('hex');


  const quarantineSecret =
    randomBytes(64)
      .toString('base64url');


  const quarantineHash =
    await bcrypt.hash(
      quarantineSecret,
      12
    );


  const expiresAt =
    new Date(
      Date.now() +
      ttlMinutes * 60 * 1000
    );


  await prisma.$transaction(
    async tx => {

      /*
       * Preserve the credential being invalidated.
       */

      await tx.systemPasswordHistory.create({
        data: {
          user_id:
            user.id,

          password_hash:
            user.password_hash,
        },
      });


      /*
       * Revoke open challenges before inserting the new one.
       */

      await tx.systemCredentialChallenge.updateMany({
        where: {
          user_id:
            user.id,

          consumed_at:
            null,

          revoked_at:
            null,
        },

        data: {
          revoked_at:
            new Date(),
        },
      });


      /*
       * Replace the currently usable credential with an
       * unrecoverable random quarantine credential.
       */

      await tx.systemUser.update({
        where: {
          id:
            user.id,
        },

        data: {
          password_hash:
            quarantineHash,

          must_reset_password:
            true,

          failed_login_count:
            0,

          locked_until:
            null,

          row_version: {
            increment: 1,
          },
        },
      });


      /*
       * Existing sessions do not survive credential compromise.
       */

      const now =
        new Date();


      await tx.systemSession.updateMany({
        where: {
          user_id:
            user.id,

          is_active:
            true,
        },

        data: {
          is_active:
            false,

          invalidated_at:
            now,

          last_activity_at:
            now,
        },
      });


      await tx.systemCredentialChallenge.create({
        data: {
          user_id:
            user.id,

          school_id:
            schoolId,

          purpose,

          token_hash:
            tokenHash,

          issued_by:
            issuedBy,

          expires_at:
            expiresAt,
        },
      });


      await tx.systemAuditEvent.create({
        data: {
          user_id:
            user.id,

          school_id:
            schoolId,

          action:
            'CREDENTIAL_CHALLENGE_ISSUED',

          entity_type:
            'system_user',

          entity_id:
            user.id,

          before_state:
            null,

          after_state:
            JSON.stringify({
              purpose,
              expiresAt:
                expiresAt.toISOString(),
            }),
        },
      });

    }
  );


  const absoluteFile =
    path.resolve(
      tokenFile
    );


  fs.mkdirSync(
    path.dirname(
      absoluteFile
    ),
    {
      recursive: true,
      mode: 0o700,
    }
  );


  fs.writeFileSync(
    absoluteFile,
    [
      `email=${email}`,
      `schoolId=${schoolId}`,
      `purpose=${purpose}`,
      `expiresAt=${expiresAt.toISOString()}`,
      `activationToken=${token}`,
      '',
    ].join('\n'),
    {
      encoding: 'utf8',
      mode: 0o600,
    }
  );


  console.log(
    'Credential challenge issued successfully.'
  );

  console.log(
    'Activation token value was NOT printed.'
  );

  console.log(
    'Secure token file:'
  );

  console.log(
    absoluteFile
  );

  console.log(
    'Expires:'
  );

  console.log(
    expiresAt.toISOString()
  );

}


main()
  .catch(err => {

    console.error(
      err.message || err
    );

    process.exitCode = 1;

  })
  .finally(async () => {

    await prisma
      .$disconnect()
      .catch(() => {});

  });
