import { ContainerPublisherConfig } from './types';
import getPublisher from './getPublisher';
import { createTmpDir, Platform, shell } from 'ern-core';
import path from 'path';

export default async function publishContainer(conf: ContainerPublisherConfig) {
  let publicationWorkingDir = conf.containerPath;
  if (!conf.inPlace) {
    // Duplicate the directory containing generated Container to a temporary
    // directory, and pass this temporary directory to the publisher.
    // This is done because Container generation and publication are
    // clearly distinct (separation of concerns), we don't want the publisher
    // to update the Container generated code for its publication needs.
    // It also ensures that this function can be called multiple times
    // with different publishers for the same Container (idempotent).
    // Otherwise, if publication changes were made to the original Container
    // path, it would be much harder to use a different publisher for the
    // same Container.
    publicationWorkingDir = createTmpDir();
    shell.cp(
      '-Rf',
      path.join(conf.containerPath, '{.*,*}'),
      publicationWorkingDir,
    );
  }

  conf.containerPath = publicationWorkingDir;
  conf.ernVersion = Platform.currentVersion;

  const publisher = await getPublisher(conf.publisher);

  if (!publisher.platforms.includes(conf.platform)) {
    throw new Error(
      `The ${publisher.name} publisher does not support publication of ${conf.platform} Containers`,
    );
  }
  return publisher.publish(conf);
}
