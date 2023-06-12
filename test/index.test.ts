import assert = require('assert');
import { ImageAssetTesting } from '../lib/index'
import { execSync } from 'child_process';



describe('IntegrationTest', () => {
    const imageAssets = new ImageAssetTesting('./test/fixtures/test-cdk.out')

    it('should should build', async () => {
        const imageTags = await imageAssets.buildAll()
    
        //expect.assertions(imageTags.length)
        for (let tag of imageTags) {
            expect(imageAssets.docker.exists(tag)).resolves.toBe(true)
        }

    })
    
})