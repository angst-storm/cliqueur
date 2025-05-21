data "yandex_dns_zone" "default" {
  dns_zone_id = "dns37mc2jj73fuv1df34"
}

data "yandex_vpc_network" "default" {
  name = "default"
}

data "yandex_vpc_subnet" "default" {
  subnet_id = data.yandex_vpc_network.default.subnet_ids[0]
}

data "yandex_compute_image" "container-optimized-image" {
  # family = "container-optimized-image-gpu"
  image_id = "fd8hag4tk836cpcetlbj"
}

resource "yandex_container_registry" "default" {
  name = "cliqueur"
}

resource "yandex_container_registry_iam_binding" "pull-all" {
  registry_id = yandex_container_registry.default.id
  role        = "container-registry.images.puller"

  members = [
    "userAccount:${var.user_id}",
    "serviceAccount:${yandex_iam_service_account.cliqueur.id}"
  ]
}

resource "yandex_iam_service_account" "cliqueur" {
  folder_id = var.folder_id
  name      = "cliqueur"
}

resource "yandex_vpc_address" "cliqueur" {
  name = "cliqueur"

  external_ipv4_address {
    zone_id = data.yandex_vpc_subnet.default.zone
  }
}

resource "yandex_cm_certificate" "cliqueur" {
  name    = "cliqueur"
  domains = ["cliqueur.sergei-kiprin.ru"]

  managed {
    challenge_type = "DNS_CNAME"
  }
}

resource "yandex_dns_recordset" "cetificate" {
  zone_id = data.yandex_dns_zone.default.id
  ttl     = 600
  name    = yandex_cm_certificate.cliqueur.challenges[0].dns_name
  type    = yandex_cm_certificate.cliqueur.challenges[0].dns_type
  data    = [yandex_cm_certificate.cliqueur.challenges[0].dns_value]
}

resource "yandex_dns_recordset" "cliqueur" {
  zone_id = data.yandex_dns_zone.default.id
  name    = "cliqueur.sergei-kiprin.ru."
  type    = "A"
  ttl     = 600
  data    = [yandex_vpc_address.cliqueur.external_ipv4_address[0].address]
}

resource "yandex_compute_instance" "cliqueur" {
  name               = "cliqueur"
  service_account_id = yandex_iam_service_account.cliqueur.id

  scheduling_policy {
    preemptible = true
  }

  # platform_id = "standard-v3"
  # resources {
  #   cores  = 4
  #   memory = 16
  # }

  platform_id = "standard-v3-t4i"
  resources {
    gpus   = 1
    cores  = 4
    memory = 16
  }

  boot_disk {
    initialize_params {
      image_id = data.yandex_compute_image.container-optimized-image.id
      size     = 64
    }
  }

  network_interface {
    subnet_id      = data.yandex_vpc_subnet.default.id
    nat            = true
    nat_ip_address = yandex_vpc_address.cliqueur.external_ipv4_address[0].address
  }

  metadata = {
    docker-compose = templatefile("docker-compose.yaml", {
      gigachat_api_key        = var.gigachat_api_key
      images_gigachat_api_key = var.images_gigachat_api_key
      process_images          = var.process_images
      app_base_url            = "cliqueur.sergei-kiprin.ru"
      backend_cr              = "cr.yandex/${yandex_container_registry.default.id}/backend"
      backend_tag             = var.backend_image_tag
      frontend_cr             = "cr.yandex/${yandex_container_registry.default.id}/frontend"
      frontend_tag            = var.frontend_image_tag
      nginx_cr                = "cr.yandex/${yandex_container_registry.default.id}/nginx"
      minio_password          = var.minio_password
    })
    ssh-keys = "angstorm:${var.ssh_pub}"
  }

  allow_stopping_for_update = true
}
