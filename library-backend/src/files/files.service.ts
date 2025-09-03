import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { isError } from 'src/utils/type-guards';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly awsRegion: string;

  constructor(private readonly configService: ConfigService) {
    this.awsRegion = this.configService.getOrThrow<string>('aws.region');
    this.bucketName = this.configService.getOrThrow<string>('aws.s3BucketName');

    this.s3Client = new S3Client({
      region: this.awsRegion,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'aws.secretAccessKey',
        ),
      },
    });
  }

  async uploadPublicFile(
    dataBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    const fileExtension = path.extname(filename);
    const key = `${uuid()}${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Body: dataBuffer,
          Key: key,
        }),
      );

      return `https://${this.bucketName}.s3.${this.awsRegion}.amazonaws.com/${key}`;
    } catch (error: unknown) {
      if (isError(error)) {
        throw new InternalServerErrorException(
          `File upload failed: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'File upload failed due to an unknown error.',
      );
    }
  }
}
