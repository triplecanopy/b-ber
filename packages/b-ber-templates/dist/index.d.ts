import File from "vinyl";

//#region \0rolldown/runtime.js
//#endregion
//#region src/Ncx/index.d.ts
declare class Ncx {
  static head(): string;
  static title(): string;
  static author(): string;
  static document(): File.BufferFile;
  static navPoint(data: any): string;
  static navPoints(data: any): any;
}
//#endregion
//#region src/Opf/Guide.d.ts
declare class Guide {
  static body(): File.BufferFile;
  static item({
    type,
    title,
    href
  }: {
    type: any;
    title: any;
    href: any;
  }): string;
  static items(data: any): any;
}
//#endregion
//#region src/Opf/Manifest.d.ts
declare class Manifest {
  static body(): File.BufferFile;
  static item(file: any): string;
}
//#endregion
//#region src/Opf/Metadata.d.ts
declare class Metadata {
  static uid(): string;
  static body(): File.BufferFile;
  static meta(data: any): string;
}
//#endregion
//#region src/Opf/Pkg.d.ts
declare class Pkg {
  static body(): File.BufferFile;
}
//#endregion
//#region src/Opf/Spine.d.ts
declare class Spine {
  static body(): File.BufferFile;
  static item({
    fileName,
    extension,
    linear
  }: {
    fileName: any;
    extension: any;
    linear: any;
  }): string;
  static items(data: any): any;
}
declare namespace index_d_exports {
  export { Guide, Manifest, Metadata, Pkg, Spine };
}
//#endregion
//#region src/Ops/index.d.ts
declare class Ops {
  static mimetype(): string;
}
//#endregion
//#region src/Project/index.d.ts
declare class Project {
  static directories(src: string): string[];
  static relativePath(src: string, ...rest: string[]): string;
  static absolutePath(src: string, ...rest: string[]): string;
  static configYAML(src: string, config?: Record<string, any>): {
    relativePath: string;
    absolutePath: string;
    content: string;
  };
  static tocYAML(src: string): {
    relativePath: string;
    absolutePath: string;
    content: string;
  };
  static metadataYAML(src: string): {
    relativePath: string;
    absolutePath: string;
    content: string;
  };
  static javascripts(src: string): Array<{
    relativePath: string;
    absolutePath: string;
    content: string;
  }>;
  static markdown(src: string): Array<{
    relativePath: string;
    absolutePath: string;
    content: string;
  }>;
  static stylesheets(): never[];
  static readme(src: string): {
    relativePath: string;
    absolutePath: string;
    content: string;
  };
  static gitignore(src: string): {
    relativePath: string;
    absolutePath: string;
    content: string;
  };
}
//#endregion
//#region src/Toc/index.d.ts
declare class Toc {
  static body(): File.BufferFile;
  static item(data: any): string;
  static items(data: any): string;
}
//#endregion
//#region src/Xhtml/index.d.ts
declare class Xhtml {
  static head(): File.BufferFile;
  static body(): File.BufferFile;
  static tail(): File.BufferFile;
  static cover({
    width,
    height,
    href
  }: {
    width: any;
    height: any;
    href: any;
  }): string;
  static stylesheet(inline?: boolean): File.BufferFile;
  static javascript(inline?: boolean): File.BufferFile;
  static jsonLD(): File.BufferFile;
  static loi(): string;
}
//#endregion
//#region src/Xml/index.d.ts
declare class Xml {
  static container(): string;
  static mimetype(): string;
}
//#endregion
export { Ncx, index_d_exports as Opf, Ops, Project, Toc, Xhtml, Xml };
//# sourceMappingURL=index.d.ts.map