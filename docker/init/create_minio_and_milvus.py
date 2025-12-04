#!/usr/bin/env python3
import time
import socket
import os
import boto3
from botocore.client import Config
from pymilvus import connections, FieldSchema, CollectionSchema, Collection, DataType, utility

MINIO_HOST = os.environ.get("MINIO_HOST", "do_an_fa25_minio")
MINIO_PORT = int(os.environ.get("MINIO_PORT", 9000))
MINIO_USER = os.environ.get("MINIO_ROOT_USER", "minioadmin")
MINIO_PASS = os.environ.get("MINIO_ROOT_PASSWORD", "minioadmin")
MINIO_BUCKET = os.environ.get("MINIO_BUCKET", "genspa-data")

MILVUS_HOST = os.environ.get("MILVUS_HOST", "do_an_fa25_milvus")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "19530")
MILVUS_COLLECTION = os.environ.get("MILVUS_COLLECTION", "booking_embeddings")
EMBED_DIM = int(os.environ.get("EMBED_DIM", 1536))

DB_HOST = os.environ.get("DB_HOST", "mysql")
DB_PORT = int(os.environ.get("DB_PORT", 3306))


def wait_tcp(host, port, timeout=120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=3):
                print(f"TCP {host}:{port} reachable")
                return True
        except Exception as e:
            print(f"Waiting for {host}:{port}... {e}")
            time.sleep(2)
    return False


def create_minio_bucket():
    endpoint = f"http://{MINIO_HOST}:{MINIO_PORT}"
    print("Connecting to MinIO at", endpoint)
    s3 = boto3.resource(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=MINIO_USER,
        aws_secret_access_key=MINIO_PASS,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1'
    )
    try:
        s3.meta.client.head_bucket(Bucket=MINIO_BUCKET)
        print("Bucket exists:", MINIO_BUCKET)
    except Exception:
        print("Creating bucket:", MINIO_BUCKET)
        s3.create_bucket(Bucket=MINIO_BUCKET)
        print("Bucket created")


def create_milvus_collection():
    print(f"Connecting to Milvus {MILVUS_HOST}:{MILVUS_PORT}")
    connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
    if utility.has_collection(MILVUS_COLLECTION):
        print("Milvus collection exists:", MILVUS_COLLECTION)
        return

    fields = [
        FieldSchema(name="pk", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBED_DIM),
    ]
    schema = CollectionSchema(fields, description="Booking embeddings")
    collection = Collection(MILVUS_COLLECTION, schema)
    print("Created collection", MILVUS_COLLECTION)
    index_params = {"index_type": "IVF_FLAT", "metric_type": "L2", "params": {"nlist": 128}}
    collection.create_index("embedding", index_params)
    print("Created index")


def main():
    print("Init script starting: wait for services...")
    if not wait_tcp(DB_HOST, DB_PORT, timeout=180):
        print("DB not reachable, exiting")
        return
    if not wait_tcp(MINIO_HOST, MINIO_PORT, timeout=180):
        print("MinIO not reachable, exiting")
        return
    if not wait_tcp(MILVUS_HOST, int(MILVUS_PORT), timeout=180):
        print("Milvus not reachable, exiting")
        return

    try:
        create_minio_bucket()
    except Exception as e:
        print("MinIO init failed:", e)

    try:
        create_milvus_collection()
    except Exception as e:
        print("Milvus init failed:", e)

    print("Init tasks finished")


if __name__ == '__main__':
    main()
