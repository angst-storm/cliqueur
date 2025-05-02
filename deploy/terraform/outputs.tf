output "registry_url" {
  value = "cr.yandex/${yandex_container_registry.default.id}"
}

output "machine_ip" {
  value = yandex_compute_instance.cliqueur.network_interface[0].nat_ip_address
}
