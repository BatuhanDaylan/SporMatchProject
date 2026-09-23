// CSS ve CSS-module importları için ambient tip bildirimleri.
// Expo'nun web CSS desteği için gerekli; native tarafta etkisizdir.

declare module '*.css';

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
