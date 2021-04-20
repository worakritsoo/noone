const c = [
	() => import("..\\..\\..\\src\\routes\\$layout.svelte"),
	() => import("..\\..\\..\\src\\routes\\$error.svelte"),
	() => import("..\\..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\settings\\$layout.svelte"),
	() => import("..\\..\\..\\src\\routes\\settings\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\settings\\notifications\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\settings\\profile\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\search\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\about.svelte"),
	() => import("..\\..\\..\\src\\routes\\links\\index.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/settings/index.svelte
	[/^\/settings\/?$/, [c[0], c[3], c[4]], [c[1]]],

	// src/routes/settings/notifications/index.svelte
	[/^\/settings\/notifications\/?$/, [c[0], c[3], c[5]], [c[1]]],

	// src/routes/settings/profile/index.svelte
	[/^\/settings\/profile\/?$/, [c[0], c[3], c[6]], [c[1]]],

	// src/routes/graphql.ts
	[/^\/graphql\/?$/],

	// src/routes/search/index.svelte
	[/^\/search\/?$/, [c[0], c[7]], [c[1]]],

	// src/routes/about.svelte
	[/^\/about\/?$/, [c[0], c[8]], [c[1]]],

	// src/routes/links/index.svelte
	[/^\/links\/?$/, [c[0], c[9]], [c[1]]]
];

export const fallback = [c[0](), c[1]()];