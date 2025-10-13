import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

export default function(prisma: PrismaClient){
  return async function tenantMiddleware(req: Request & { tenant?: any }, res: Response, next: NextFunction){
    // subdomain resolution
    const host = req.headers.host || '';
    const domain = host.split(':')[0];
    // allow explicit header override for dev
    const domainHint = req.headers['x-tenant-domain'] as string | undefined;
    const lookup = domainHint || domain;
    if(lookup){
      const tenant = await prisma.tenant.findUnique({ where: { domain: lookup } });
      if(tenant) req.tenant = tenant;
    }
    next();
  }
}
