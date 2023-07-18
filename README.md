# cdk-image-testing

This is a simple tool to build container images in a CDK application for testing.

## Setup

```
npm install --save-dev cdk-image-testing
```

## Usage

```typescript
import { ImageAssetTesting } from "cdk-image-testing"
import { spawnSync } from 'child_process'

// set jest timeout to 5 minutes
jest.setTimeout(5 * 60 * 1000)

describe('test-image-asset-build', () => {
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  
  // Add construct with container image assets here.
  // This test assumes Dockerfile has a build target called "test".

  const assembly = app.synth()
  const imageAssets = new ImageAssetTesting(assembly.directory)

  test('pytest', async () => {
      const imageTags = await imageAssets.buildAll("test")

      for (let tag of imageTags) {
          const result = spawnSync('docker', ['run', '--network', 'host', tag], { stdio: 'inherit' });
          expect(result.status).toBe(0);
      }        
  })
})
```
