ENV ?= development

# The default target must be at the top
.DEFAULT_GOAL := start

install:
	npm install

update-deps:
	ncu -u
	make install

migrate:
	NODE_ENV=$(ENV) ./node_modules/.bin/knex --esm migrate:latest --knexfile knexfile.mjs

seed:
	NODE_ENV=$(ENV) ./node_modules/.bin/knex --esm seed:run --knexfile knexfile.mjs

start:
	NODE_ENV=$(ENV) ./node_modules/gulp/bin/gulp.js -f gulpfile.cjs

build-assets:
	./node_modules/gulp/bin/gulp.js -f gulpfile.cjs build

clean-dist:
	rm -rf dist

build: clean-dist build-assets

stop:
	pm2 stop weather-checker-$(ENV) 2>/dev/null || true
	pm2 delete weather-checker-$(ENV)  2>/dev/null || true

run:
	NODE_ENV=$(ENV) NODE_CONFIG_STRICT_MODE=0 pm2 start 'node ./dist/server/server.js' --name weather-checker-$(ENV) --time

test:
	./node_modules/.bin/xo
