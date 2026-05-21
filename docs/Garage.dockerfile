  garage:
    image: minio/minio:latest
    container_name:
  smatway-garage
    restart: unless-stopped
    ports:
      - "9100:9000"   # S3 API  ←
   this is what GARAGE_PUBLIC_URL
   points to
      - "9101:9001"   # Web
  console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD:
  minioadmin
    volumes:
      - smatway-garage-data:/data
    command: minio server /data
  --console-address ":9001"