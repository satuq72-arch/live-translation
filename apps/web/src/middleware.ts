import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Alle Routen die eingeloggt sein müssen
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/translate(.*)',
  '/billing(.*)',
  '/history(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtected(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
