# Install cdk8s for MacoS (Or use documentation)
install-cdk8s:
  # https://cdk8s.io/docs/latest/getting-started/#install-the-cli
	brew install cdk8s

# Initialize a app with typescript and cdk8s-plus
init-app-kplus:
	mkdir app
	cd app
	cdk8s init typescript-app
	npm install cdk8s-plus-26 cdk8s constructs