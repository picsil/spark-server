declare module 'File' {
  declare type File = {
    buffer: Buffer,
    originalname: string,
  };

  declare module.exports File;
}
