import React from "react";
import Layout from "../components/Layout/Layout";
import POSInterface from "../components/POS/POSInterface";

const POSPage = () => {
  return (
    <Layout currentPage="pos">
      <POSInterface />
    </Layout>
  );
};

export default POSPage;
