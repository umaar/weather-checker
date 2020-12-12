declare module 'forcedomain';
declare module 'connect-session-knex';
declare module 'connect-flash';
declare module 'duration-relativetimeformat';

declare namespace Express {
	export interface Request {
		flash(event: string, item: Record<string, unknown>): any;
		flash(event: string): Record<string, unknown>;
	}
}