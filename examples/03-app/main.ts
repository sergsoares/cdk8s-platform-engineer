import { App, Chart, Helm } from 'cdk8s';
import { KubeNamespace } from './imports/k8s';

const app = new App();
const chart = new Chart(app, '03-app');

new KubeNamespace(chart, '03-app', {metadata: {name: '03-app'}})

new Helm(chart, 'cache', {
  chart: 'bitnami/redis',
  namespace: '03-app',
  values: {
    auth: {
      password: "secretpassword"
    },
    sentinel: {
      enabled: true
    }
  }
});

app.synth();