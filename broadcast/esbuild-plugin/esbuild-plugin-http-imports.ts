// deno-lint-ignore-file
// deno-fmt-ignore-file

// based on https://github.com/lucsoft/esbuild-plugin-http-imports/blob/main/index.ts
// modification idea from https://github.com/jed/esbuild-plugin-http-fetch/pull/4

import type {
    Loader,
    OnLoadArgs,
    OnLoadResult,
    OnResolveArgs,
    Plugin,
    PluginBuild
} from "https://deno.land/x/esbuild/mod.d.ts";

const namespace = "http-import";
const possibleLoaders: Loader[] = [ 'js', 'jsx', 'ts', 'tsx', 'css', 'json', 'text', 'base64', 'file', 'dataurl', 'binary', 'default' ];
const binaryLoaders: Loader[] = [ 'binary', 'file', "dataurl" ];
const contentTypeToLoader: { [key in string]: Loader } = {
  "application/javascript": "js",
  "application/typescript": "ts",
  "application/json": "json",
  "text/plain": "text",
  "text/css": "css",
}
const responseCache: { [ path in string ]: Response } = {}
export type Options = {
    allowPrivateModules?: boolean;
    defaultToJavascriptIfNothingElseFound?: boolean;
    disableCache?: boolean;
    onCacheMiss?: (path: string) => void;
    onCacheHit?: (path: string) => void;
};

export const httpImports = (options: Options = {}): Plugin => ({
    name: namespace,
    setup(build) {
        build.onResolve({ filter: /^https:\/\// }, ({ path }: OnResolveArgs) => ({ path, namespace }));
        build.onResolve({ filter: /.*/, namespace }, ({ path, importer }: OnResolveArgs) => ({ path: new URL(path.replace(/\?.*/, ""), importer).toString(), namespace }));
        build.onLoad({ filter: /.*/, namespace }, async ({ path }: OnLoadArgs): Promise<OnLoadResult> => {
            const headers = new Headers();
            if (options.allowPrivateModules) appendAuthHeaderFromPrivateModules(path, headers);

            const source = await useResponseCacheElseLoad(options, path, headers);
            if (!source.ok) throw new Error(`GET ${path} failed: status ${source.status}`);
            let contents = await source.clone().text();
            contents = await handeSourceMaps(contents, source, headers);
            const { pathname } = new URL(path);
            const contentType = source.headers.get("content-type")?.split(";")[0].replace(/\s/g, "");

            // Find perfect Loader for extension
            const loader = detectLoader(build, contentType, pathname.split(".").at(-1));
            return {
                contents: binaryLoaders.includes(loader ?? "default")
                    ? new Uint8Array(await source.clone().arrayBuffer())
                    : contents,
                loader: options.defaultToJavascriptIfNothingElseFound
                    ? (loader && possibleLoaders.includes(loader)
                        ? loader
                        : "js")
                    : loader
            };
        });
    }
})


const loadMap = async (url: URL, headers: Headers) => {
    const map = await fetch(url.href, { headers });
    const type = map.headers.get("content-type")?.replace(/\s/g, "");
    const buffer = await map.arrayBuffer();
    const blob = new Blob([ buffer ], { type });
    const reader = new FileReader();
    return new Promise((cb) => {
        reader.onload = (e) => cb(e.target?.result);
        reader.readAsDataURL(blob);
    });
};

async function useResponseCacheElseLoad(options: Options, path: string, headers: Headers): Promise<Response> {
    if (responseCache[ path ] && !options.disableCache) {
        options.onCacheHit?.(path);
        return responseCache[ path ];
    }
    options.onCacheMiss?.(path);
    return responseCache[ path ] = await fetch(path.split("?")[ 0 ], { headers });
}

async function handeSourceMaps(contents: string, source: Response, headers: Headers) {
    const pattern = /\/\/# sourceMappingURL=(\S+)/;
    const match = contents.match(pattern);
    if (match) {
        const url = new URL(match[ 1 ], source.url);
        const dataurl = await loadMap(url, headers);
        const comment = `//# sourceMappingURL=${dataurl}`;
        return contents.replace(pattern, comment);
    }
    return contents;
}

function appendAuthHeaderFromPrivateModules(path: string, headers: Headers) {
    const env = Deno.env.get("DENO_AUTH_TOKENS")?.trim();
    if (!env) return;

    try {
        const denoAuthToken = env.split(";").find(x => new URL(`https://${x.split("@").at(-1)!}`).hostname == new URL(path).hostname);

        if (!denoAuthToken) return;

        if (denoAuthToken.includes(":"))
            headers.append("Authorization", `Basic ${btoa(denoAuthToken.split('@')[ 0 ])}`);
        else
            headers.append("Authorization", `Bearer ${denoAuthToken.split('@')[ 0 ]}`);

    } catch (error) {
        console.log(error, env);
        return;
    }
}

function detectLoader(build: PluginBuild, contentType: string | undefined, extension: string | undefined): Loader | undefined {
  if (contentType !== undefined) {
    const loaderFromContentType = contentTypeToLoader[contentType];
    if (loaderFromContentType !== undefined) return loaderFromContentType;
  }
  if (extension !== undefined) {
    const loaderFromExtensionAndOption = build.initialOptions.loader?.[ `.${extension}` ];
    if (loaderFromExtensionAndOption !== undefined) return loaderFromExtensionAndOption;
    return extension as Loader;
  }
  return undefined;
}