// Endereço do computador que está rodando a API (porta 8082) e o site (porta 5173).
// No celular, "localhost" seria o próprio celular, então use o IP do computador na rede.
// No Windows, descubra o IP com o comando: ipconfig  (procure "Endereço IPv4").
export const HOST = '192.168.0.10';

export const API_URL = `http://${HOST}:8082`;
export const WEB_URL = `http://${HOST}:5173`;
