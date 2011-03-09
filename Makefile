# Handy little Makefile

all:
	zip -r ~/Public/fx-extensions/devtools-installer.xpi * -x ".git/*" -x ".*" -x "*~" -x "*.bak"
