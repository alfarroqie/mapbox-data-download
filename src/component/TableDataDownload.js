import React, {useState} from 'react';
import { Table, Input } from 'antd';

import dataDownload from '../data/data-download.json'

export default function DataDownload() {

  const columns = [
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Average Download',
      dataIndex: 'avg_download_throughput',
      key: 'avg_download_throughput',
    },
  ]

  const [dataSource, setDataSource] = useState(dataDownload);
  const [valueSearch, setValueSearch] = useState('');

  function handleSearch (key) {
    const currValue = key;
    setValueSearch(currValue);
    const filterTable = dataDownload.filter(o =>
      Object.keys(o).some(k =>
        String(o[k])
          .toLowerCase()
          .includes(currValue.toLowerCase())
      )
    );
    setDataSource(filterTable);
  };

  return (
    <>
    <div className="dataDownload">
      <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search`}
            value={valueSearch}
            onChange={e => handleSearch(e.target.value)}
            style={{ marginBottom: 8, display: 'block' }}
          />
      </div>
      <Table columns={columns} dataSource={dataSource} size="middle"/>
    </div>
    </>
  );
}