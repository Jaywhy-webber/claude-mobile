declare module "qrcode-terminal" {
  interface Options {
    small?: boolean;
  }
  export function generate(
    text: string,
    opts?: Options,
    cb?: (qrcode: string) => void,
  ): void;
}
