import { ArtifactType, AssetManifestProperties, Manifest } from 'aws-cdk-lib/cloud-assembly-schema'
import { AssetManifest, DockerImageManifestEntry } from 'cdk-assets'
import { Docker } from 'cdk-assets/lib/private/docker';
import * as path from 'path';

export interface TestingDockerImageManifestEntry extends DockerImageManifestEntry {
    manifestDirectory: string
}

/**
 * A way to build image assets from a cloud assembly for testing purposes
 * 
 * @example
 * 
 * describe('container images', () => {
 *   const imageAssets = new ImageAssetTesting('cdk.out/assembly-dev')
 *   it('pass local tests', async () => {
 *     const imageTags = await imageAssets.buildAll("test")
 * 
 *     for (let tag of imageTags) {
 *       const result = spawnSync('docker', ['run', tag]);
 * 
 *       if (result.status !== 0) {
 *         console.error(result.stdout.toString())
 *         console.error(result.stderr.toString())
 *       }
 *       expect(result.status).toBe(0);
 *     }
 *   })
 * })
 */
export class ImageAssetTesting {
    public readonly imageAssets: TestingDockerImageManifestEntry[] = []

    private docker: Docker

    constructor(cloudAssemblyPath: string) {
        this.docker = new Docker()

        const manifest = Manifest.loadAssemblyManifest(path.join(cloudAssemblyPath, 'manifest.json'))
        for (const [name, artifact] of Object.entries(manifest.artifacts!)) {
            if (artifact.type === ArtifactType.ASSET_MANIFEST) {
                const properties: AssetManifestProperties = artifact.properties as AssetManifestProperties
                const assetManifest = AssetManifest.fromPath(path.join(cloudAssemblyPath, properties.file))
                assetManifest.entries.forEach(entry => {
                    if (entry.type === 'docker-image') {
                        this.imageAssets.push({
                            manifestDirectory: assetManifest.directory,
                            ...entry as DockerImageManifestEntry,
                        })
                    }
                })
            }
        }
    }

    /**
     * Build all container image assets in the cloud assembly.
     * 
     * @param buildTarget Container build target.  Defaults to the default target in the cloud assembly.
     * 
     * @returns List of built image tags
     */
    public async buildAll(buildTarget?: string): Promise<string[]> {
        let buildTags: string[] = []

        let builds: Promise<void>[] = []

        for (let entry of this.imageAssets) {
            const tag = `cdkasset-${entry.id.assetId.toLowerCase()}`
            buildTags.push(tag)
            builds.push(this.docker.build({
                directory: path.join(entry.manifestDirectory, entry.source.directory!),
                tag,
                buildArgs: entry.source.dockerBuildArgs,
                buildSecrets: entry.source.dockerBuildSecrets,
                target: buildTarget ?? entry.source.dockerBuildTarget,
                file: entry.source.dockerFile,
                networkMode: entry.source.networkMode,
                platform: entry.source.platform,
                outputs: entry.source.dockerOutputs,
                cacheFrom: entry.source.cacheFrom,
                cacheTo: entry.source.cacheTo,
            }));
        }

        await Promise.all(builds)

        return buildTags
    }
}