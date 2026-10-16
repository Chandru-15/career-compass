const { BlobServiceClient } = require("@azure/storage-blob");
const { randomUUID } = require("node:crypto");
const { required } = require("../config");
const { fail, logError } = require("./errors");
let container;
function getContainer() {
  if (!container)
    container = BlobServiceClient.fromConnectionString(
      required("AZURE_STORAGE_CONNECTION_STRING"),
      { retryOptions: { maxTries: 2, tryTimeoutInMs: 15000 } },
    ).getContainerClient(required("AZURE_STORAGE_CONTAINER_NAME"));
  return container;
}
class BlobService {
  static async verifyPrivate() {
    const properties = await getContainer().getProperties({
      abortSignal: AbortSignal.timeout(15000),
    });
    if (properties.blobPublicAccess)
      throw fail(
        503,
        "The resume container must be private. Disable public access in Azure Storage.",
      );
    return true;
  }
  static async uploadResume(file, userId) {
    try {
      await this.verifyPrivate();
      const blobName =
        userId +
        "/" +
        randomUUID() +
        "-" +
        file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      await getContainer()
        .getBlockBlobClient(blobName)
        .uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mimetype },
          abortSignal: AbortSignal.timeout(30000),
        });
      return { blobName };
    } catch (error) {
      logError("Blob upload", error);
      throw error.publicMessage
        ? error
        : fail(
            502,
            "Resume storage upload failed. Check Azure Storage configuration and try again.",
          );
    }
  }
  static async downloadFile(blobName) {
    return getContainer()
      .getBlockBlobClient(blobName)
      .downloadToBuffer(0, undefined, {
        abortSignal: AbortSignal.timeout(30000),
      });
  }
  static async deleteFile(blobName) {
    await getContainer()
      .getBlockBlobClient(blobName)
      .deleteIfExists({ abortSignal: AbortSignal.timeout(15000) });
  }
}
module.exports = { BlobService };
