// Some of these tests require at least two servers:
// Some of these tests require s3 and s6 storage servers
// and also working a, e and x servers:

const otherServers = { 
  "domain" : ".codegradx.org",
  "names": ["a", "e", "x", "s"],
  "protocol": "https",
  "a": {
      "suffix": "/alive",
      "protocol": "https",
      "0": {
          "host": "a5.codegradx.org",
          "enabled": false
      },
      "1": {
          "host": "a6.codegradx.org",
          "enabled": false
      }
  },
  "e": {
      "suffix": "/alive",
      "protocol": "https",
      "0": {
          "host": "e5.codegradx.org",
          "enabled": false
      },
      "1": {
          "host": "e6.codegradx.org",
          "enabled": false
      }
  },
  "x": {
      "suffix": "/dbalive",
      "protocol": "https",
      "0": {
          "host": "x5.codegradx.org",
          "enabled": false
      },
      "1": {
          "host": "x6.codegradx.org",
          "enabled": false
      }
  },
  "s": {
      "suffix": "/index.txt",
      "protocol": "https",
      "0": {
          "host": "s5.codegradx.org",
          "enabled": false
      },
      "1": {
          "host": "s6.codegradx.org",
          "enabled": false
      },
      "2": {
          "host": "s3.codegradx.org",
          "enabled": false
      }
  }
};

export default otherServers;

// end of otherServers.mjs
