import { App, Chart } from 'cdk8s';
import { KubeDeployment, KubeIngress, KubeService } from './imports/k8s';

const app = new App();
const chart = new Chart(app, 'app-test', {
  disableResourceNameHashes: true
});

const labels = {app: "nginx"}
new KubeDeployment(chart, 'deployment', {
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
            image: "nginx",
            name: "nginx",
            ports: [
              { containerPort: 80}
            ]
          }
        ]
      }
    }
  }
})

new KubeService(chart, "svc", {
  spec: {
    selector: labels,
    ports: [
      { port: 80}
    ]
  },
})

new KubeIngress(chart, 'ingress', {
  spec: {
    rules: [
      {
        http: {
          paths: [
            {
              path: "/",
              pathType: "Prefix",
              backend: {
                service: {
                  name: "app-test-svc",
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
