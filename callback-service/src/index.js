const configuredClientId = '3d1d872b-594c-8197-b019-00378bd32fc3';
const extensionCallbackUri = 'vscode://linkzelda99-cpp.notion-sidebar/auth/callback';
const transactionLifetimeMs = 10 * 60 * 1000;

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (request.method === 'POST' && url.pathname === '/auth/start') return startAuthorization(url, env);
		if (request.method === 'POST' && url.pathname === '/auth/redeem') return redeemHandoff(request, env);
		if (request.method === 'POST' && url.pathname === '/auth/refresh') return refreshToken(request, env);
		if (request.method === 'GET' && url.pathname === '/auth/callback') return handleCallback(url, env);
		return json({ error: 'Not found' }, 404);
	},
};

async function startAuthorization(url, env) {
	if (!env.NOTION_CLIENT_SECRET) return json({ error: 'OAuth service is not configured' }, 503);
	const state = randomToken();
	const transaction = env.OAUTH_TRANSACTIONS.get(env.OAUTH_TRANSACTIONS.idFromName(state));
	await transaction.fetch('https://transaction/start', { method: 'POST' });
	const authorizationUrl = new URL('https://api.notion.com/v1/oauth/authorize');
	authorizationUrl.search = new URLSearchParams({
		owner: 'user',
		client_id: env.NOTION_CLIENT_ID || configuredClientId,
		redirect_uri: getRedirectUri(url, env),
		response_type: 'code',
		state,
	}).toString();
	return json({ authorizationUrl: authorizationUrl.toString(), state });
}

async function handleCallback(url, env) {
	const state = url.searchParams.get('state');
	if (!state || !/^[a-f0-9]{64}$/.test(state)) return redirectToExtension({ error: 'invalid_state' });
	const transaction = env.OAUTH_TRANSACTIONS.get(env.OAUTH_TRANSACTIONS.idFromName(state));
	const result = await transaction.fetch('https://transaction/callback', {
		method: 'POST',
		body: JSON.stringify({ state, code: url.searchParams.get('code'), error: url.searchParams.get('error'), redirectUri: getRedirectUri(url, env) }),
	});
	const payload = await result.json();
	if (!result.ok) return redirectToExtension({ error: payload.error || 'authorization_failed' });
	return redirectToExtension({ handoff: payload.handoff, state });
}

async function redeemHandoff(request, env) {
	const body = await readJson(request);
	if (!body || typeof body.handoff !== 'string' || !/^[a-f0-9]{64}$/.test(body.handoff)) return json({ error: 'Invalid handoff' }, 400);
	const transaction = env.OAUTH_TRANSACTIONS.get(env.OAUTH_TRANSACTIONS.idFromName(body.handoff));
	const result = await transaction.fetch('https://transaction/redeem', { method: 'POST', body: JSON.stringify(body) });
	return new Response(result.body, { status: result.status, headers: { 'content-type': 'application/json' } });
}

async function refreshToken(request, env) {
	const body = await readJson(request);
	if (!body || typeof body.refreshToken !== 'string' || body.refreshToken.length > 4096) return json({ error: 'Invalid refresh token' }, 400);
	return exchangeToken({ grant_type: 'refresh_token', refresh_token: body.refreshToken }, env);
}

export class OAuthTransaction {
	constructor(ctx, env) {
		this.ctx = ctx;
		this.env = env;
	}

	async fetch(request) {
		const url = new URL(request.url);
		if (request.method === 'POST' && url.pathname === '/start') {
			await this.ctx.storage.put('createdAt', Date.now());
			return json({ ok: true });
		}
		if (request.method === 'POST' && url.pathname === '/callback') return this.callback(await readJson(request));
		if (request.method === 'POST' && url.pathname === '/redeem') return this.redeem(await readJson(request));
		return json({ error: 'Not found' }, 404);
	}

	async callback(body) {
		const createdAt = await this.ctx.storage.get('createdAt');
		if (typeof createdAt !== 'number' || Date.now() - createdAt > transactionLifetimeMs || await this.ctx.storage.get('used')) return json({ error: 'invalid_state' }, 400);
		if (body?.error || typeof body?.code !== 'string' || body.code.length > 4096 || !this.env.NOTION_CLIENT_SECRET) return json({ error: body?.error || 'authorization_failed' }, 400);
		const response = await exchangeToken({ grant_type: 'authorization_code', code: body.code, redirect_uri: body.redirectUri }, this.env);
		if (!response.ok) return response;
		const tokens = await response.json();
		await this.ctx.storage.put('handoff', body.state);
		await this.ctx.storage.put('tokens', JSON.stringify(tokens));
		await this.ctx.storage.put('handoffCreatedAt', Date.now());
		return json({ handoff: body.state });
	}

	async redeem(body) {
		const handoff = await this.ctx.storage.get('handoff');
		const createdAt = await this.ctx.storage.get('handoffCreatedAt');
		if (typeof handoff !== 'string' || body?.handoff !== handoff || typeof createdAt !== 'number' || Date.now() - createdAt > transactionLifetimeMs || await this.ctx.storage.get('used')) return json({ error: 'Invalid or expired handoff' }, 400);
		await this.ctx.storage.put('used', true);
		const tokens = await this.ctx.storage.get('tokens');
		await this.ctx.storage.deleteAll();
		return tokens ? new Response(tokens, { headers: { 'content-type': 'application/json' } }) : json({ error: 'Handoff unavailable' }, 400);
	}
}

async function exchangeToken(body, env) {
	const encoded = btoa(`${env.NOTION_CLIENT_ID || configuredClientId}:${env.NOTION_CLIENT_SECRET}`);
	const response = await fetch('https://api.notion.com/v1/oauth/token', {
		method: 'POST',
		headers: { Accept: 'application/json', Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const payload = await response.json();
	return !response.ok || typeof payload.access_token !== 'string' || typeof payload.refresh_token !== 'string' ? json({ error: 'token_exchange_failed' }, 502) : json(payload);
}

function redirectToExtension(params) {
	const target = new URL(extensionCallbackUri);
	target.search = new URLSearchParams(params).toString();
	return Response.redirect(target.toString(), 302);
}

function getRedirectUri(url, env) {
	return env.NOTION_REDIRECT_URI || new URL('/auth/callback', url).toString();
}

async function readJson(request) { try { return await request.json(); } catch { return undefined; } }
function randomToken() { return [...crypto.getRandomValues(new Uint8Array(32))].map(byte => byte.toString(16).padStart(2, '0')).join(''); }
function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } }); }
