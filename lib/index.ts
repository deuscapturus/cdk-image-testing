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
 * TODO
 */
export class ImageAssetTesting {
    public readonly imageAssets: TestingDockerImageManifestEntry[] = []

    public docker: Docker

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

    public async buildAll(): Promise<string[]> {
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
                target: entry.source.dockerBuildTarget,
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