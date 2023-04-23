import { App, Chart } from 'cdk8s';
import * as cdk8s from './imports/k8s';

const app = new App();
const chart = new Chart(app, 'new-app2', {
  disableResourceNameHashes: true
}
);

const port = 80
const labels = { app : "nginx"};

new cdk8s.KubeDeployment(chart, 'deploy', {
  spec: {
    selector: {
      matchLabels: labels
    },
    template: {
      metadata: {
        labels: labels
      },
      spec: {
        containers: [
          {
            name: "app",
            image: "nginx",
            ports: [
              { containerPort: port }
            ]
          }
        ]
      }
    }
  }
})

const svcName = "app-svc"

new cdk8s.KubeService(chart, 'svc', {
  metadata: {
    name: svcName
  },
  spec: {
    selector: labels,
    ports: [
      { port: 80}
    ]
  }
})


new cdk8s.KubeIngress(chart, 'ingress', {
  spec: {
    rules: [
      {
        http: {
          paths: [
            {
              pathType: "Prefix",
              path: "/",
              backend: {
                service: {
                  name: svcName,
                  port: {
                    number: 80
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
})

app.synth();
