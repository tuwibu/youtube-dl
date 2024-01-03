import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { WORKER_URL } from '../constants';

export type InfoIpState = {
  address: string,
  username?: string,
  password?: string,
  protocol: 'http' | 'https' | 'socks5',
  status: string,
  country: string,
  region: string,
  city: string,
  zip: string,
  lat: number,
  lon: number,
  timezone: string,
  query: string
}

export const checkProxy = async ({ address, username, password }: {
  address: string,
  username?: string,
  password?: string
}): Promise<InfoIpState> => {
  try {
    const [host, port] = address.split(':');
    let config: AxiosRequestConfig = {};
    if (username && password) {
      let agent = new HttpsProxyAgent(`http://${username}:${password}@${host}:${port}`);
      config = {
        httpAgent: agent,
        httpsAgent: agent
      }
    } else {
      let agent = new HttpsProxyAgent(`http://${host}:${port}`);
      config = {
        httpAgent: agent,
        httpsAgent: agent
      }
    }
    const response = await axios({
      url: `${WORKER_URL}/ip`,
      method: 'GET',
      ...config,
      timeout: 10000
    })
    return {
      ...response.data,
      address,
      username,
      password
    };
  } catch (ex: any) {
    throw new Error('An error proxy: ' + ex.message);
  }
}

export const parseProxyString = (proxyString: string): {
  username?: string;
  password?: string;
  address: string;
} => {
  let username: string | null = null;
  let password: string | null = null;
  if (proxyString.includes("@")) {
    const usernameAndPassword = proxyString.split("@")[0];
    const usernameAndPasswordSplit = usernameAndPassword.split(":");
    username = usernameAndPasswordSplit[0];
    password = usernameAndPasswordSplit[1];
    return {
      username,
      password,
      address: proxyString.split("@")[1],
    };
  } else {
    const address = proxyString.includes("://") ? proxyString.split("://")[1] : proxyString;
    return {
      address,
    };
  }
}

export const getAgentProxy = ({ username, password, address }: {
  address: string,
  username?: string,
  password?: string
}): any => {
  try {
    if (username && password) {
      let agent = new HttpsProxyAgent(`http://${username}:${password}@${address}`);
      return agent
    } else {
      let agent = new HttpsProxyAgent(`http://${address}`);
      return agent
    }
  } catch (ex: any) {
    throw new Error('An error proxy: ' + ex.message);
  }
}

