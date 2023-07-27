import { ArtifactType, AssetManifestProperties, Manifest } from 'aws-cdk-lib/cloud-assembly-schema'
import { AssetManifest, DockerImageManifestEntry } from 'cdk-assets'
import { Docker } from 'cdk-assets/lib/private/docker';
import * as path from 'path';

export interface TestingDockerImageManifestEntry extends DockerImageManifestEntry {
    manifestDirectory: string
    /**
     * Docker build this image asset
     * 
     * @param buildTarget Container build target.  Defaults to the default target in the cloud assembly.
     * 
     * @returns The built image tag
     */
    buildTarget(buildTarget?: string): Promise<string>
    docker: Docker
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
                        const dockerEntry = entry as DockerImageManifestEntry
                        this.imageAssets.push({
                            manifestDirectory: assetManifest.directory,
                            docker: this.docker,
                            buildTarget(buildTarget?: string): Promise<string> {
                                const target = buildTarget ?? dockerEntry.source.dockerBuildTarget
                                const targetTag = target ? `-${target}` : ''
                                const tag = `cdkasset-${entry.id.assetId.toLowerCase()}${targetTag}:test`

                                const buildPromise = this.docker.build({
                                    directory: path.join(this.manifestDirectory, dockerEntry.source.directory!),
                                    tag,
                                    buildArgs: dockerEntry.source.dockerBuildArgs,
                                    buildSecrets: dockerEntry.source.dockerBuildSecrets,
                                    target,
                                    file: dockerEntry.source.dockerFile,
                                    networkMode: dockerEntry.source.networkMode,
                                    platform: dockerEntry.source.platform,
                                    outputs: dockerEntry.source.dockerOutputs,
                                    cacheFrom: dockerEntry.source.cacheFrom,
                                    cacheTo: dockerEntry.source.cacheTo,
                                });

                                return buildPromise.then(() => tag)
                            },
                            ...dockerEntry,
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

        let builds: Promise<string>[] = []

        for (let entry of this.imageAssets) {
            const target = buildTarget ?? entry.source.dockerBuildTarget
            const targetTag = target ? `-${target}` : ''
            const tag = `cdkasset-${entry.id.assetId.toLowerCase()}${targetTag}:test`

            buildTags.push(tag)
            builds.push(entry.buildTarget(buildTarget));
        }

        return await Promise.all(builds)
    }
}