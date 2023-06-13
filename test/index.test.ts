import { Docker } from 'cdk-assets/lib/private/docker'
import { ImageAssetTesting } from '../lib/index'

const docker = new Docker()

describe('IntegrationTest', () => {
    const imageAssets = new ImageAssetTesting('./test/fixtures/test-cdk.out')

    it('should buildAll()', async () => {
        const imageTags = await imageAssets.buildAll("test")
    })
})