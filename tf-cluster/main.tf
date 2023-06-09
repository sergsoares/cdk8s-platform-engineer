terraform {
  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "0.0.17"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "1.14.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "2.9.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.19.0"
    }
  }
}

provider "kind" {}

resource "kind_cluster" "default" {
  name           = "cdk8s-platform-engineer"
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"

      kubeadm_config_patches = [
        "kind: InitConfiguration\nnodeRegistration:\n  kubeletExtraArgs:\n    node-labels: \"ingress-ready=true\"\n"
      ]

      extra_port_mappings {
        container_port = 80
        host_port      = 80
      }
      extra_port_mappings {
        container_port = 443
        host_port      = 443
      }
    }
  }
}

provider "kubernetes" {
  host                   = kind_cluster.default.endpoint
  cluster_ca_certificate = kind_cluster.default.cluster_ca_certificate
  client_certificate     = kind_cluster.default.client_certificate
  client_key             = kind_cluster.default.client_key
}

provider "kubectl" {
  host                   = kind_cluster.default.endpoint
  cluster_ca_certificate = kind_cluster.default.cluster_ca_certificate
  client_certificate     = kind_cluster.default.client_certificate
  client_key             = kind_cluster.default.client_key
}

provider "helm" {
  kubernetes {
    host                   = kind_cluster.default.endpoint
    cluster_ca_certificate = kind_cluster.default.cluster_ca_certificate
    client_certificate     = kind_cluster.default.client_certificate
    client_key             = kind_cluster.default.client_key
  }
}

resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = "5.24.0"
  create_namespace = true
  wait             = true
  timeout          = 240

  # https://github.com/argoproj/argo-helm/issues/1780#issuecomment-1433743590
  set {
    # Run server without TLS
    name  = "configs.params.server\\.insecure"
    value = true
  }
}

resource "kubectl_manifest" "argoapp" {
  depends_on = [helm_release.argocd]

  override_namespace = "argocd"
  yaml_body          = <<YAML
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/sergsoares/lab-kind-with-managed-argocd.git
    targetRevision: HEAD
    path: applications/app-generator
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated: {}
    syncOptions:
      - CreateNamespace=true
YAML
}

data "kubectl_path_documents" "ingress-nginx" { 
  pattern = "${path.module}/manifests/nginx-ingress.yml"
}

resource "kubectl_manifest" "ingress-nginx" {
  count     = length(data.kubectl_path_documents.ingress-nginx.documents)
  yaml_body = element(data.kubectl_path_documents.ingress-nginx.documents, count.index)
}

data "kubectl_path_documents" "simple-app" {
  pattern = "${path.module}/manifests/simple-app.yml"
}

resource "kubectl_manifest" "simple-app" {
  count     = length(data.kubectl_path_documents.simple-app.documents)
  yaml_body = element(data.kubectl_path_documents.simple-app.documents, count.index)
}

resource "helm_release" "cnpg" {
  name             = "cnpg"
  namespace        = "cnpg-system"
  repository       = "https://cloudnative-pg.github.io/charts"
  chart            = "cloudnative-pg"
  version          = "0.17.1"
  create_namespace = true
  wait             = true
  timeout          = 360
}
