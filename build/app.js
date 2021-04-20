var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
import {getGraphQLParameters} from "graphql-helix/dist/get-graphql-parameters.js";
import {processRequest} from "graphql-helix/dist/process-request.js";
import {renderGraphiQL} from "graphql-helix/dist/render-graphiql.js";
import {shouldRenderGraphiQL} from "graphql-helix/dist/should-render-graphiql.js";
import {GraphQLSchema, GraphQLObjectType, GraphQLInt} from "graphql";
import Fuse from "fuse.js";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe};
}
const s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error,
  branch,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error) {
    error.stack = options2.get_stack(error);
  }
  if (branch) {
    branch.forEach(({node, loaded, fetched, uses_credentials}) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({node}) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = {head: "", html: "", css: ""};
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 ? `<style amp-custom>${Array.from(styles).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error2) => {
      throw new Error(`Failed to serialize session data: ${error2.message}`);
    })},
				host: ${page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error)},
					nodes: [
						${branch.map(({node}) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page.path)},
						query: new URLSearchParams(${s$1(page.query.toString())}),
						params: ${s$1(page.params)}
					}
				}` : "null"}
			});
		</script>`;
  }
  const head2 = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, json}) => `<script type="svelte-data" url="${url}">${json}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options2.template({head: head2, body})
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error) {
  if (!error)
    return null;
  let serialized = try_serialize(error);
  if (!serialized) {
    const {name, message, stack} = error;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error};
    }
    return {status, error};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base, path) {
  const baseparts = path[0] === "/" ? [] : base.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
const s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error
}) {
  const {module} = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          response = await fetch(url, opts);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new Response(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = {...opts.headers};
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            const rendered = await ssr({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                fetched.push({
                  url,
                  json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                });
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: {...context}
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error;
    }
    loaded = await module.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
const escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({request, options: options2, state, $session, status, error}) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error
    })
  ];
  try {
    return await render_response({
      request,
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error,
      branch,
      page
    });
  } catch (error2) {
    options2.handle_error(error2);
    return {
      status: 500,
      headers: {},
      body: error2.stack
    };
  }
}
async function respond$1({request, options: options2, state, $session, route}) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error2) {
    options2.handle_error(error2);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error2
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.force) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: loaded.loaded.redirect
                }
              };
            }
            if (loaded.loaded.error) {
              ({status, error} = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error = e;
          }
          if (error) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      request,
      options: options2,
      $session,
      page_config,
      status,
      error,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (error2) {
    options2.handle_error(error2);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error2
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession({context: request.context});
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({...request, params});
    if (response) {
      if (typeof response !== "object") {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; 
						 expected an object, got ${typeof response}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone = {};
  for (const key in obj) {
    clone[key.toLowerCase()] = obj[key];
  }
  return clone;
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
class ReadOnlyFormData {
  constructor(map) {
    _map.set(this, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield key;
      }
    }
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value;
      }
    }
  }
}
_map = new WeakMap();
function parse_body(req) {
  const raw = req.rawBody;
  if (!raw)
    return raw;
  const [type, ...directives] = req.headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const {data, append} = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const {data, append} = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function ssr(incoming, options2, state = {}) {
  if (incoming.path.endsWith("/") && incoming.path !== "/") {
    const q = incoming.query.toString();
    return {
      status: 301,
      headers: {
        location: incoming.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const incoming_with_body = {
    ...incoming,
    body: parse_body(incoming)
  };
  const context = await options2.hooks.getContext(incoming_with_body) || {};
  try {
    return await options2.hooks.handle({
      request: {
        ...incoming_with_body,
        params: null,
        context
      },
      render: async (request) => {
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function hash(str) {
  let hash2 = 5381, i = str.length;
  while (i)
    hash2 = hash2 * 33 ^ str.charCodeAt(--i);
  return (hash2 >>> 0).toString(36);
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, {$$slots = {}, context = new Map()} = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
var root_svelte_svelte_type_style_lang = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$2 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\texport let props_3 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}>\\n\\t\\t\\t\\t\\t{#if components[3]}\\n\\t\\t\\t\\t\\t\\t<svelte:component this={components[3]} {...(props_3 || {})}/>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</svelte:component>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AA2DC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {stores} = $$props;
  let {page} = $$props;
  let {components} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  let {props_2 = null} = $$props;
  let {props_3 = null} = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  if ($$props.props_3 === void 0 && $$bindings.props_3 && props_3 !== void 0)
    $$bindings.props_3(props_3);
  $$result.css.add(css$2);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {
        default: () => `${components[3] ? `${validate_component(components[3] || missing_component, "svelte:component").$$render($$result, Object.assign(props_3 || {}), {}, {})}` : ``}`
      })}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `Navigated to ${escape(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head: head2, body}) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		\n	<script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js"></script>\n	<script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"></script>\n	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css"/>\n		' + head2 + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
let options = null;
function init(settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-073b141d.js",
      css: ["/./_app/assets/start-a8cd1609.css"],
      js: ["/./_app/start-073b141d.js", "/./_app/chunks/vendor-e25105b5.js"]
    },
    fetched: void 0,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error) => String(error),
    handle_error: (error) => {
      console.error(error.stack);
      error.stack = options.get_stack(error);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    router: true,
    ssr: true,
    target: "#svelte",
    template
  };
}
const empty = () => ({});
const manifest = {
  assets: [],
  layout: "src/routes/$layout.svelte",
  error: "src/routes/$error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/index.svelte"],
      b: ["src/routes/$error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/settings\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/settings/$layout.svelte", "src/routes/settings/index.svelte"],
      b: ["src/routes/$error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/settings\/notifications\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/settings/$layout.svelte", "src/routes/settings/notifications/index.svelte"],
      b: ["src/routes/$error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/settings\/profile\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/settings/$layout.svelte", "src/routes/settings/profile/index.svelte"],
      b: ["src/routes/$error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/graphql\/?$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return graphql;
      })
    },
    {
      type: "page",
      pattern: /^\/search\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/search/index.svelte"],
      b: ["src/routes/$error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/about.svelte"],
      b: ["src/routes/$error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/links\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/links/index.svelte"],
      b: ["src/routes/$error.svelte"]
    }
  ]
};
const get_hooks = (hooks) => ({
  getContext: hooks.getContext || (() => ({})),
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({request, render: render2}) => render2(request))
});
const module_lookup = {
  "src/routes/$layout.svelte": () => Promise.resolve().then(function() {
    return $layout$3;
  }),
  "src/routes/$error.svelte": () => Promise.resolve().then(function() {
    return $error$1;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$5;
  }),
  "src/routes/settings/$layout.svelte": () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  "src/routes/settings/index.svelte": () => Promise.resolve().then(function() {
    return index$4;
  }),
  "src/routes/settings/notifications/index.svelte": () => Promise.resolve().then(function() {
    return index$3;
  }),
  "src/routes/settings/profile/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/search/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/about.svelte": () => Promise.resolve().then(function() {
    return about;
  }),
  "src/routes/links/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
const metadata_lookup = {"src/routes/$layout.svelte": {entry: "/./_app/pages/$layout.svelte-23c10756.js", css: ["/./_app/assets/pages/$layout.svelte-eae091cc.css"], js: ["/./_app/pages/$layout.svelte-23c10756.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}, "src/routes/$error.svelte": {entry: "/./_app/pages/$error.svelte-55dabfa8.js", css: [], js: ["/./_app/pages/$error.svelte-55dabfa8.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}, "src/routes/index.svelte": {entry: "/./_app/pages/index.svelte-5bd4abec.js", css: [], js: ["/./_app/pages/index.svelte-5bd4abec.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}, "src/routes/settings/$layout.svelte": {entry: "/./_app/pages/settings/$layout.svelte-0f7cdc0c.js", css: [], js: ["/./_app/pages/settings/$layout.svelte-0f7cdc0c.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}, "src/routes/settings/index.svelte": {entry: "/./_app/pages/settings/index.svelte-6aed79a7.js", css: [], js: ["/./_app/pages/settings/index.svelte-6aed79a7.js", "/./_app/chunks/vendor-e25105b5.js", "/./_app/chunks/Title-9b063d7f.js"], styles: null}, "src/routes/settings/notifications/index.svelte": {entry: "/./_app/pages/settings/notifications/index.svelte-acfae39c.js", css: [], js: ["/./_app/pages/settings/notifications/index.svelte-acfae39c.js", "/./_app/chunks/vendor-e25105b5.js", "/./_app/chunks/Title-9b063d7f.js"], styles: null}, "src/routes/settings/profile/index.svelte": {entry: "/./_app/pages/settings/profile/index.svelte-6329fdf5.js", css: [], js: ["/./_app/pages/settings/profile/index.svelte-6329fdf5.js", "/./_app/chunks/vendor-e25105b5.js", "/./_app/chunks/Title-9b063d7f.js"], styles: null}, "src/routes/search/index.svelte": {entry: "/./_app/pages/search/index.svelte-03a23b95.js", css: ["/./_app/assets/pages/search/index.svelte-f9fa0e0b.css"], js: ["/./_app/pages/search/index.svelte-03a23b95.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}, "src/routes/about.svelte": {entry: "/./_app/pages/about.svelte-b81f9138.js", css: [], js: ["/./_app/pages/about.svelte-b81f9138.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}, "src/routes/links/index.svelte": {entry: "/./_app/pages/links/index.svelte-3f55465f.js", css: [], js: ["/./_app/pages/links/index.svelte-3f55465f.js", "/./_app/chunks/vendor-e25105b5.js"], styles: null}};
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
init({paths: {base: "", assets: "/."}});
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return ssr({...request, host}, options, {prerender: prerender2});
}
const createSchema = async () => {
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      description: "The main entrypoint to our API",
      fields: {
        double: {
          args: {
            number: {description: "The number to multiply", type: GraphQLInt}
          },
          description: "Get the number, times two",
          type: GraphQLInt,
          resolve(_source, {number}, {authorization}) {
            return number * 2;
          }
        }
      }
    })
  });
};
const defaultQuery = `# Try out our API with a query like this:

query {
	double(number: 12)
}
`;
const schemaPromise = createSchema();
const respond = async (request) => {
  if (typeof request.body === "string")
    request.body = JSON.parse(request.body);
  if (shouldRenderGraphiQL(request))
    return {
      body: renderGraphiQL({
        defaultQuery
      }),
      headers: {"Content-Type": "text/html"},
      status: 200
    };
  const parameters = getGraphQLParameters(request);
  const result = await processRequest({
    ...parameters,
    contextFactory: () => {
      var _a;
      return {
        authorization: (_a = request.headers["Authorization"]) != null ? _a : request.headers["authorization"]
      };
    },
    request,
    schema: await schemaPromise
  });
  if (result.type === "RESPONSE") {
    const headers = {};
    for (const {name, value} of result.headers) {
      headers[name] = value;
    }
    return {
      body: result.payload,
      headers,
      status: result.status
    };
  }
  return {
    body: "svelte-add/graphql doesn't support multipart responses or event streams",
    headers: {},
    status: 501
  };
};
const del = ({body, headers, query}) => respond({body, headers, method: "DELETE", query});
const get = ({body, headers, query}) => respond({body, headers, method: "GET", query});
const head = ({body, headers, query}) => respond({body, headers, method: "HEAD", query});
const post = ({body, headers, query}) => respond({body, headers, method: "POST", query});
const put = ({body, headers, query}) => respond({body, headers, method: "PUT", query});
var graphql = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  del,
  get,
  head,
  post,
  put
});
var Header_svelte_svelte_type_style_lang = "section.svelte-7xi5xe{display:flex;justify-content:center;align-items:center;justify-content:space-between}";
const css$1 = {
  code: "section.svelte-7xi5xe{display:flex;justify-content:center;align-items:center;justify-content:space-between}",
  map: '{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<section>\\n\\t<h1>Pea</h1>\\n\\t<nav>\\n\\t\\t<a href=\\".\\">\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01</a>\\n\\t\\t<a href=\\"about\\">\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A</a>\\n\\t\\t<a href=\\"search\\">\u0E04\u0E49\u0E19\u0E2B\u0E32</a>\\n\\t\\t<a href=\\"links\\">\u0E25\u0E34\u0E49\u0E07</a>\\n\\t\\t<a href=\\"settings\\">\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32</a>\\n\\t</nav>\\n</section>\\n\\n<style>\\n\\tsection {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: space-between;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAYC,OAAO,cAAC,CAAC,AACR,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,AAC/B,CAAC"}'
};
const Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<section class="${"svelte-7xi5xe"}"><h1>Pea</h1>
	<nav><a href="${"."}">\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01</a>
		<a href="${"about"}">\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A</a>
		<a href="${"search"}">\u0E04\u0E49\u0E19\u0E2B\u0E32</a>
		<a href="${"links"}">\u0E25\u0E34\u0E49\u0E07</a>
		<a href="${"settings"}">\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32</a></nav>
</section>`;
});
const $layout$2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<main>${slots.default ? slots.default({}) : ``}</main>

<footer>
</footer>`;
});
var $layout$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout$2
});
function load$1({error, status}) {
  return {
    props: {title: `${status}: ${error.message}`}
  };
}
const $error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {title} = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  return `<h1>${escape(title)}</h1>`;
});
var $error$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $error,
  load: load$1
});
const load = async ({fetch: fetch2}) => {
  const query = `
			query Doubled($x: Int) {
				double(number: $x)
			}
		`;
  const variables = {x: 19};
  const response = await fetch2("/graphql", {
    body: JSON.stringify({query, variables}),
    headers: {
      Authorization: "Token ABC123",
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const {data, errors} = await response.json();
  if (errors)
    return {
      error: new Error(errors.map(({message}) => message).join("\n")),
      status: 500
    };
  return {props: {doubled: data.double}};
};
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {doubled} = $$props;
  if ($$props.doubled === void 0 && $$bindings.doubled && doubled !== void 0)
    $$bindings.doubled(doubled);
  return `${escape(doubled)}

`;
});
var index$5 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Routes,
  load
});
const prerender = true;
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<section class="${"text-gray-600 body-font"}"><div class="${"container px-5 py-24 mx-auto"}"><div class="${"flex flex-col text-center w-full mb-20"}"><h1 class="${"sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900"}">\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32</h1>
			<p class="${"lg:w-2/3 mx-auto leading-relaxed text-base"}">\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 \u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \u0E41\u0E25\u0E30 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27
			</p></div>
		<div class="${"flex flex-col text-center w-full mb-20"}"><div class="${"submenu"}"><a sveltekit:prefetch href="${"/settings/profile"}">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27</a>
				| <a sveltekit:prefetch href="${"/settings/notifications"}">\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19</a></div>
			${slots.default ? slots.default({}) : ``}</div></div></section>`;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout,
  prerender
});
const Title = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {title} = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  return `<title>${escape(title)}</title>

`;
});
const Settings = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Title, "Title").$$render($$result, {title: "Settings"}, {}, {})}`;
});
var index$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Settings
});
const Notifications = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Title, "Title").$$render($$result, {title: "Notifications"}, {}, {})}
<h2 class="${"sm:text-3xl text-2xl font-normal mb-4 text-gray-900"}">\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19</h2>`;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Notifications
});
const Profile = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Title, "Title").$$render($$result, {title: "Profile"}, {}, {})}
<h2 class="${"sm:text-3xl text-2xl font-normal mb-4 text-gray-900"}">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27</h2>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Profile
});
const db = [
  {
    title: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E20\u0E39\u0E21\u0E34\u0E20\u0E32\u0E04",
    url: "www.pea.co.th",
    prefix: "\u0E01\u0E1F\u0E20.",
    user: "Worakrit Soontornthamniti",
    content: "some contnet",
    point: 0
  },
  {
    title: "\u0E2D\u0E34\u0E19\u0E17\u0E23\u0E32\u0E40\u0E19\u0E47\u0E15 \u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E20\u0E39\u0E21\u0E34\u0E20\u0E32\u0E04",
    url: "http://intranet.pea.co.th",
    prefix: "\u0E01\u0E1F\u0E20.",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E2D\u0E34\u0E19\u0E17\u0E23\u0E32\u0E40\u0E19\u0E47\u0E15 \u0E01\u0E1F\u0E15.3",
    url: "http://intra.pea.co.th/peas3",
    prefix: "\u0E01\u0E1F\u0E15.3",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E42\u0E1B\u0E23\u0E48\u0E07\u0E43\u0E2A \u0E01\u0E1F\u0E15.3 \u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35 2564",
    url: "http://strms.pea.co.th/s3/2564/tprS3-64/home.php",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C \u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27 \u0E01\u0E1F\u0E15.3",
    url: "http://greenoffice.pea.co.th/2564/",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E2A\u0E2B\u0E01\u0E23\u0E13\u0E4C\u0E2D\u0E2D\u0E21\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E4C \u0E01\u0E1F\u0E20.",
    url: "http://www.peacoop.or.th/",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E32\u0E23\u0E25\u0E07\u0E17\u0E38\u0E19 MFCfund",
    url: "https://www.mfcfund.com",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E04\u0E25\u0E31\u0E07\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49 \u0E01\u0E1F\u0E15.3 youtube",
    url: "http://bct.pea.co.th/youtube/",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E2B\u0E19\u0E35\u0E49\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E04\u0E49\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30 ETSx",
    url: "http://c2intra.pea.co.th/c2/ETSx_C2",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E1C\u0E25 \u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E32\u0E21\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 OKR",
    url: "http://okr.pea.co.th/",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "Dashboard ",
    url: "https://sites.google.com/view/s3-pms/home",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E23\u0E30\u0E1A\u0E1A\u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1E\u0E31\u0E2A\u0E14\u0E38",
    url: "https://simp-peadashboard.web.app",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E14\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E23\u0E32\u0E22\u0E43\u0E2B\u0E0D\u0E48\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    url: "https://smr.pea.co.th",
    user: "Worakrit Soontornthamniti"
  },
  {
    title: "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19/\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A \u0E01\u0E32\u0E23\u0E02\u0E2D\u0E04\u0E37\u0E19\u0E40\u0E07\u0E34\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49",
    url: "http://cdp.pea.co.th/",
    user: "Worakrit Soontornthamniti"
  }
];
var index_svelte_svelte_type_style_lang = ".box.svelte-14vs6kt{display:block;padding:auto;margin:2px;width:100%;border:2px solid purple}";
const css = {
  code: ".box.svelte-14vs6kt{display:block;padding:auto;margin:2px;width:100%;border:2px solid purple}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport { db } from '$lib/data/link';\\n\\n\\timport Fuse from 'fuse.js';\\n\\n\\texport let textInputs = '';\\n\\n\\tconst fuse = new Fuse(db, {\\n\\t\\tkeys: ['title', 'description'],\\n\\t\\tincludeScore: true\\n\\t});\\n\\t$: linkResult = fuse.search(textInputs);\\n\\n\\tfunction finding() {\\n\\t\\treturn '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E32\u0E08\u0E32\u0E01\u0E40\u0E0B\u0E34\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C';\\n\\t}\\n\\n\\tfunction add() {\\n\\t\\tconsole.log('\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19');\\n\\t}\\n</script>\\n\\n<!-- markup (zero or more items) goes here -->\\n<section>\\n\\t<div class=\\"flex justify-center my-5\\">\\n\\t\\t<input\\n\\t\\t\\tclass=\\" text-center bg-purple-200 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 \\"\\n\\t\\t\\ttype=\\"search\\"\\n\\t\\t\\tbind:value={textInputs}\\n\\t\\t\\tplaceholder=\\"\u0E04\u0E49\u0E19\u0E2B\u0E32\\"\\n\\t\\t/>\\n\\t\\t<button on:click={finding}> \u0E04\u0E49\u0E19\u0E2B\u0E32\u{1F680} </button>\\n\\t\\t<button on:click={add}> \u0E40\u0E1E\u0E34\u0E48\u0E21 </button>\\n\\t</div>\\n\\n\\t<div class=\\"grid\\">\\n\\t\\t<ul>\\n\\t\\t\\t{#each linkResult as link}\\n\\t\\t\\t\\t<div class=\\"box\\">\\n\\t\\t\\t\\t\\t<h2>\\n\\t\\t\\t\\t\\t\\t{JSON.stringify(link)}\\n\\t\\t\\t\\t\\t</h2>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/each}\\n\\t\\t</ul>\\n\\t</div>\\n</section>\\n\\n<style>\\n\\t.box {\\n\\t\\tdisplay: block;\\n\\t\\tpadding: auto;\\n\\t\\tmargin: 2px;\\n\\t\\twidth: 100%;\\n\\t\\tborder: 2px solid purple;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAiDC,IAAI,eAAC,CAAC,AACL,OAAO,CAAE,KAAK,CACd,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,GAAG,CACX,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,MAAM,AACzB,CAAC"}`
};
const Search = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let linkResult;
  let {textInputs = ""} = $$props;
  const fuse = new Fuse(db, {
    keys: ["title", "description"],
    includeScore: true
  });
  if ($$props.textInputs === void 0 && $$bindings.textInputs && textInputs !== void 0)
    $$bindings.textInputs(textInputs);
  $$result.css.add(css);
  linkResult = fuse.search(textInputs);
  return `
<section><div class="${"flex justify-center my-5"}"><input class="${" text-center bg-purple-200 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 "}" type="${"search"}" placeholder="${"\u0E04\u0E49\u0E19\u0E2B\u0E32"}"${add_attribute("value", textInputs, 1)}>
		<button>\u0E04\u0E49\u0E19\u0E2B\u0E32\u{1F680} </button>
		<button>\u0E40\u0E1E\u0E34\u0E48\u0E21 </button></div>

	<div class="${"grid"}"><ul>${each(linkResult, (link) => `<div class="${"box svelte-14vs6kt"}"><h2>${escape(JSON.stringify(link))}</h2>
				</div>`)}</ul></div>
</section>`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Search
});
const About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: About
});
const Links = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Links
});
export {init, render};
