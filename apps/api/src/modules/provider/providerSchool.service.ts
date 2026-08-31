import {
  createHash,
  randomBytes,
} from 'crypto';
import {
  withProviderContext,
} from '../../lib/providerContext';

type JsonResult = {
  ok: boolean;
  reason?: string;
  schoolId?: string;
  nominationId?: string;
};

async function callResult(
  fn:
    (tx: any) =>
      Promise<
        Array<{
          result: JsonResult;
        }>
      >
): Promise<JsonResult> {
  return withProviderContext(
    undefined,
    async tx => {
      const rows = await fn(tx);

      return (
        rows[0]?.result || {
          ok: false,
          reason: 'NO_RESULT',
        }
      );
    }
  );
}

export async function listProviderSchools() {
  return withProviderContext(
    undefined,
    tx =>
      tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          code: string;
          status: string;
          row_version: number;
          delegate_status: string | null;
        }>
      >`
        SELECT *
        FROM system.provider_school_list()
      `
  );
}

export async function createProviderSchool(
  input: {
    name: string;
    code: string;
    schoolType: string;
    address: string;
    city: string;
    region: string;
    country: string;
    phone?: string;
    email?: string;
    ownershipType?: string;
  }
) {
  const result =
    await callResult(
      tx =>
        tx.$queryRaw`
          SELECT
            system.provider_school_create(
              ${input.name},
              ${input.code},
              ${input.schoolType},
              ${input.address},
              ${input.city},
              ${input.region},
              ${input.country},
              ${input.phone || null},
              ${input.email || null},
              ${input.ownershipType || null}
            ) AS result
        `
    );

  if (!result.ok) {
    throw new Error(
      result.reason ||
      'Institution creation failed'
    );
  }

  return result;
}

export async function nominateProviderDelegate(
  schoolId: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    reason: string;
  }
) {
  const inviteToken =
    randomBytes(32)
      .toString('base64url');

  const inviteTokenHash =
    createHash('sha256')
      .update(
        inviteToken,
        'utf8'
      )
      .digest('hex');

  const result =
    await callResult(
      tx =>
        tx.$queryRaw`
          SELECT
            system.provider_school_nominate_delegate(
              ${schoolId},
              ${input.firstName},
              ${input.lastName},
              ${input.email},
              ${input.phone || null},
              ${inviteTokenHash},
              ${new Date(
                Date.now() +
                24 * 60 * 60 * 1000
              )},
              ${input.reason}
            ) AS result
        `
    );

  if (
    !result.ok ||
    !result.nominationId
  ) {
    throw new Error(
      result.reason ||
      'Delegate nomination failed'
    );
  }

  return {
    ...result,
    inviteToken,
    inviteExpiresInHours: 24,
  };
}

export async function approveProviderSchool(
  schoolId: string,
  reason: string
) {
  const result =
    await callResult(
      tx =>
        tx.$queryRaw`
          SELECT
            system.provider_school_approve(
              ${schoolId},
              ${reason}
            ) AS result
        `
    );

  if (!result.ok) {
    throw new Error(
      result.reason ||
      'Institution verification approval failed'
    );
  }

  return result;
}
