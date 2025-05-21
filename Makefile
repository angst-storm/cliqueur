MACHINE_IP := 158.160.90.103
CLOUD_CR := cr.yandex/crpa870i7eio829igovi
GITHUB_CR := ghcr.io/angst-storm/cliqueur

yandex-cr-login:
	echo ${OAUTH_TOKEN} | docker login --username oauth --password-stdin cr.yandex

github-cr-login:
	echo ${GITHUB_TOKEN} | docker login ghcr.io -u USERNAME --password-stdin

tofu-apply:
	tofu -chdir=deploy/terraform apply -var-file=variables.tfvars

machine-ssh:
	ssh -i .ssh/yandex angstorm@$(MACHINE_IP)

docker-cloud-build:
	docker build backend -f deploy/cuda.dockerfile -t $(CLOUD_CR)/backend:$(IMAGE_TAG) --platform linux/amd64
	docker build frontend -t $(CLOUD_CR)/frontend:$(IMAGE_TAG) --platform linux/amd64 

docker-cloud-push:
	docker push $(CLOUD_CR)/backend:$(IMAGE_TAG)
	docker push $(CLOUD_CR)/frontend:$(IMAGE_TAG)

docker-github-push: github-cr-login
	docker tag $(CLOUD_CR)/backend:$(IMAGE_TAG) $(GITHUB_CR)/backend:$(IMAGE_TAG)
	docker tag $(CLOUD_CR)/frontend:$(IMAGE_TAG) $(GITHUB_CR)/frontend:$(IMAGE_TAG)
	docker push $(GITHUB_CR)/backend:$(IMAGE_TAG)
	docker push $(GITHUB_CR)/frontend:$(IMAGE_TAG)

clear-ssh:
	ssh-keygen -R $(MACHINE_IP)
