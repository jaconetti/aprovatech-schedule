import { Request, Response, NextFunction } from 'express'
import { adminAuth } from '../lib/firebase'
import { AuthRequest } from '../types'

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing Bearer token' })
      return
    }

    const token = authHeader.split('Bearer ')[1]

    // Validar token via Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token)

    // Injetar dados do usuário no request
    const authReq = req as AuthRequest
    authReq.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken as any).role || 'student',
    }

    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}
