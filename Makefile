
dev:
	npm run dev

build:
	npm run build

publish: build
	surge public vikacc.surge.sh
