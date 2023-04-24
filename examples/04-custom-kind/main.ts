import { App, Chart, ApiObject } from 'cdk8s';
import { KubeNamespace } from './imports/k8s';

const app = new App();
const chart = new Chart(app, '04-custom-kind', { namespace: "04-custom-kind"});
new KubeNamespace(chart, '04-custom-kind', {metadata: { name: '04-custom-kind'}})

new ApiObject(chart, 'postgresql', 
{
  apiVersion: "postgresql.cnpg.io/v1",
  kind: "Cluster",
  metadata: {
    name: "root",
  },
  spec: {
     instances: 2,
     storage: {
      size: "1Gi"
     } 
  }
});

app.synth();
