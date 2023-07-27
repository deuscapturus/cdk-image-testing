import { Docker } from 'cdk-assets/lib/private/docker'
import { ImageAssetTesting } from '../lib/index'

const docker = new Docker()

describe('IntegrationTest', () => {
    const imageAssets = new ImageAssetTesting('./test/fixtures/test-cdk.out')

    it('should buildTarget()', async () => {
        const tag = await imageAssets.imageAssets[0].buildTarget("test")
    })
    it('should buildAll()', async () => {
        const imageTags = await imageAssets.buildAll("test")
    })
})