FROM python:3.10

ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# libssl1.1
RUN wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_amd64.deb
RUN dpkg -i libssl1.1_1.1.0g-2ubuntu4_amd64.deb

# libgdiplus
RUN apt-get update
RUN apt-get install -y libgdiplus

# fonts
RUN wget http://ftp.de.debian.org/debian/pool/contrib/m/msttcorefonts/ttf-mscorefonts-installer_3.8_all.deb
RUN apt-get install -y ./ttf-mscorefonts-installer_3.8_all.deb

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip

RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "server.py"] 