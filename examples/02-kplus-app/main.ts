import { App, Chart } from 'cdk8s';
import { KubeNamespace } from './imports/k8s';

const app = new App();
const chart = new Chart(app, '02-kplus-app', {
  namespace: '02-kplus',
  disableResourceNameHashes: true
});
new KubeNamespace(chart, 'namespace', { metadata: { name: '02-kplus' } })



import * as kplus from 'cdk8s-plus-26'
const deployment = new kplus.Deployment(chart, 'dep', {
  containers: [
    {
      image: 'stefanprodan/podinfo',
      ports: [{ number: 9898 }],
      resources: {},
      securityContext: {
        ensureNonRoot: false
      }
    }
  ]
})



new kplus.HorizontalPodAutoscaler(chart, 'hpa', {
  target: deployment,
  minReplicas: 2,
  maxReplicas: 10,
  metrics: [
    kplus.Metric.resourceCpu(kplus.MetricTarget.averageUtilization(60))
  ]
});



const service = deployment.exposeViaService({ name: "podinfo" })
service.exposeViaIngress("/")


app.synth();
