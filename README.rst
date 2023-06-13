=================
cdk-image-testing
=================

This is a simple tool to build container images in a CDK application for testing.

Setup
-----

.. code:: bash

   npm install --save-dev cdk-image-testing

Usage
-----

.. code:: typescript

    import { ImageAssetTesting } from "cdk-image-testing"
    import { spawnSync } from 'child_process'
    
    // set jest timeout to 5 minutes
    jest.setTimeout(5 * 60 * 1000)
    
    describe('container images', () => {
        const imageAssets = new ImageAssetTesting('cdk.out')
        it('pass local tests', async () => {
            const imageTags = await imageAssets.buildAll("test")
    
            for (let tag of imageTags) {
                const result = spawnSync('docker', ['run', tag])
    
                if (result.status !== 0) {
                    console.error(result.stdout.toString())
                    console.error(result.stderr.toString())
                }
                expect(result.status).toBe(0)
            }
        })