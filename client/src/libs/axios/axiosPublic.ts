import axios from "axios";

const axiosPublic = axios.create({
  // headers: {
  //   'Content-Type': 'application/json'
  // },
  timeout: 120000,
});

export { axiosPublic };
