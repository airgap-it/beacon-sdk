import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { lambdaOfOperations } from '../src'
import { Operation } from '../src/typings'

// use chai-as-promised plugin
chai.use(chaiAsPromised)
const expect = chai.expect

describe('Test lambda conversion', () => {
  it('on single transaction', async () => {
    const input: Operation[] = [
      {
        destination: 'KT1FFE2LC5JpVakVjHm5mM36QVp2p3ZzH4hH',
        kind: 'transaction',
        amount: '0',
        parameters: {
          entrypoint: 'withdraw',
          value: { int: '10000' }
        }
      }
    ]
    const output = [
      {
        prim: 'DROP'
      },
      {
        prim: 'NIL',
        args: [
          {
            prim: 'operation'
          }
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'address'
          },
          {
            string: 'KT1FFE2LC5JpVakVjHm5mM36QVp2p3ZzH4hH%withdraw'
          }
        ]
      },
      {
        prim: 'CONTRACT',
        args: [
          {
            prim: 'mutez'
          }
        ]
      },
      {
        prim: 'IF_NONE',
        args: [
          [
            {
              prim: 'UNIT'
            },
            {
              prim: 'FAILWITH'
            }
          ],
          [
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'mutez'
                },
                {
                  int: '0'
                }
              ]
            },
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'mutez'
                },
                {
                  int: '10000'
                }
              ]
            },
            {
              prim: 'TRANSFER_TOKENS'
            },
            {
              prim: 'CONS'
            }
          ]
        ]
      }
    ]
    expect(await lambdaOfOperations(input, 'https://mainnet.api.tez.ie')).to.deep.equals(output)
  })

  it('on single delegation', async () => {
    const input: Operation[] = [
      {
        kind: 'delegation',
        delegate: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
      }
    ]

    const output = [
      {
        prim: 'DROP'
      },
      {
        prim: 'NIL',
        args: [
          {
            prim: 'operation'
          }
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'option',
            args: [
              {
                prim: 'key_hash'
              }
            ]
          },
          {
            prim: 'Some',
            args: [
              {
                string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
              }
            ]
          }
        ]
      },
      {
        prim: 'SET_DELEGATE'
      },
      {
        prim: 'CONS'
      }
    ]
    expect(await lambdaOfOperations(input, 'https://mainnet.api.tez.ie')).to.deep.equals(output)
  })

  it('on single origination', async () => {
    const input: Operation[] = [
      {
        kind: 'origination',
        source: 'tz1erCQMmRgZHYm2uLuksDk85Rj7Md5symaC',
        fee: '1037',
        counter: '77609128',
        gas_limit: '1826',
        storage_limit: '946',
        balance: '0',
        script: {
          code: [
            {
              prim: 'parameter',
              args: [
                {
                  prim: 'pair',
                  args: [
                    {
                      prim: 'list',
                      args: [
                        {
                          prim: 'pair',
                          args: [
                            {
                              prim: 'pair',
                              args: [
                                {
                                  prim: 'string'
                                },
                                {
                                  prim: 'bytes'
                                }
                              ]
                            },
                            {
                              prim: 'string'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      prim: 'bool'
                    }
                  ]
                }
              ]
            },
            {
              prim: 'storage',
              args: [
                {
                  prim: 'pair',
                  args: [
                    {
                      prim: 'pair',
                      args: [
                        {
                          prim: 'set',
                          args: [
                            {
                              prim: 'pair',
                              args: [
                                {
                                  prim: 'pair',
                                  args: [
                                    {
                                      prim: 'string'
                                    },
                                    {
                                      prim: 'bytes'
                                    }
                                  ]
                                },
                                {
                                  prim: 'string'
                                }
                              ]
                            }
                          ],
                          annots: ['%claims']
                        },
                        {
                          prim: 'string',
                          annots: ['%contract_type']
                        }
                      ]
                    },
                    {
                      prim: 'pair',
                      args: [
                        {
                          prim: 'big_map',
                          args: [
                            {
                              prim: 'string'
                            },
                            {
                              prim: 'bytes'
                            }
                          ],
                          annots: ['%metadata']
                        },
                        {
                          prim: 'address',
                          annots: ['%owner']
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              prim: 'code',
              args: [
                [
                  {
                    prim: 'UNPAIR'
                  },
                  {
                    prim: 'SWAP'
                  },
                  {
                    prim: 'DUP'
                  },
                  {
                    prim: 'DUG',
                    args: [
                      {
                        int: '2'
                      }
                    ]
                  },
                  {
                    prim: 'CDR'
                  },
                  {
                    prim: 'CDR'
                  },
                  {
                    prim: 'SENDER'
                  },
                  {
                    prim: 'COMPARE'
                  },
                  {
                    prim: 'NEQ'
                  },
                  {
                    prim: 'IF',
                    args: [
                      [
                        {
                          prim: 'PUSH',
                          args: [
                            {
                              prim: 'string'
                            },
                            {
                              string: 'Unauthorized.'
                            }
                          ]
                        },
                        {
                          prim: 'FAILWITH'
                        }
                      ],
                      []
                    ]
                  },
                  {
                    prim: 'PUSH',
                    args: [
                      {
                        prim: 'mutez'
                      },
                      {
                        int: '0'
                      }
                    ]
                  },
                  {
                    prim: 'AMOUNT'
                  },
                  {
                    prim: 'COMPARE'
                  },
                  {
                    prim: 'GT'
                  },
                  {
                    prim: 'IF',
                    args: [
                      [
                        {
                          prim: 'PUSH',
                          args: [
                            {
                              prim: 'string'
                            },
                            {
                              string: 'Tez not accepted.'
                            }
                          ]
                        },
                        {
                          prim: 'FAILWITH'
                        }
                      ],
                      []
                    ]
                  },
                  {
                    prim: 'UNPAIR'
                  },
                  {
                    prim: 'DUP',
                    args: [
                      {
                        int: '3'
                      }
                    ]
                  },
                  {
                    prim: 'CDR'
                  },
                  {
                    prim: 'CDR'
                  },
                  {
                    prim: 'DUP',
                    args: [
                      {
                        int: '4'
                      }
                    ]
                  },
                  {
                    prim: 'CDR'
                  },
                  {
                    prim: 'CAR'
                  },
                  {
                    prim: 'PAIR'
                  },
                  {
                    prim: 'DUP',
                    args: [
                      {
                        int: '4'
                      }
                    ]
                  },
                  {
                    prim: 'CAR'
                  },
                  {
                    prim: 'CDR'
                  },
                  {
                    prim: 'DIG',
                    args: [
                      {
                        int: '4'
                      }
                    ]
                  },
                  {
                    prim: 'CAR'
                  },
                  {
                    prim: 'CAR'
                  },
                  {
                    prim: 'DIG',
                    args: [
                      {
                        int: '3'
                      }
                    ]
                  },
                  {
                    prim: 'ITER',
                    args: [
                      [
                        {
                          prim: 'SWAP'
                        },
                        {
                          prim: 'DUP',
                          args: [
                            {
                              int: '5'
                            }
                          ]
                        },
                        {
                          prim: 'DIG',
                          args: [
                            {
                              int: '2'
                            }
                          ]
                        },
                        {
                          prim: 'UPDATE'
                        }
                      ]
                    ]
                  },
                  {
                    prim: 'DIG',
                    args: [
                      {
                        int: '3'
                      }
                    ]
                  },
                  {
                    prim: 'DROP'
                  },
                  {
                    prim: 'PAIR'
                  },
                  {
                    prim: 'PAIR'
                  },
                  {
                    prim: 'NIL',
                    args: [
                      {
                        prim: 'operation'
                      }
                    ]
                  },
                  {
                    prim: 'PAIR'
                  }
                ]
              ]
            }
          ],
          storage: {
            prim: 'Pair',
            args: [
              {
                prim: 'Pair',
                args: [
                  [
                    {
                      prim: 'Pair',
                      args: [
                        {
                          prim: 'Pair',
                          args: [
                            {
                              string:
                                'kepler://zCT5htke6GpMAeQ1R5fZ1bcAkkLhCz2YG7b1VhkfMuhFa5kvNweq/zb38SMzU4zF4iqrv2JhtZSc1a8hxDj9jbCUsRPsFc3nX1Z3UB'
                            },
                            {
                              bytes:
                                'de5cb6f72b6d080d9c9782090f3780f0977c3b53e09a2ea1b6e5662b7b392528'
                            }
                          ]
                        },
                        {
                          string: 'VerifiableCredential'
                        }
                      ]
                    }
                  ],
                  {
                    string: 'tzprofiles'
                  }
                ]
              },
              {
                prim: 'Pair',
                args: [
                  [
                    {
                      prim: 'Elt',
                      args: [
                        {
                          string: ''
                        },
                        {
                          bytes:
                            '68747470733a2f2f747a70726f66696c65732e636f6d2f747a69703031365f6d657461646174612e6a736f6e'
                        }
                      ]
                    }
                  ],
                  {
                    string: 'tz1erCQMmRgZHYm2uLuksDk85Rj7Md5symaC'
                  }
                ]
              }
            ]
          }
        }
      }
    ]

    const output = [
      {
        prim: 'DROP'
      },
      {
        prim: 'NIL',
        args: [
          {
            prim: 'operation'
          }
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'pair',
            args: [
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'set',
                    args: [
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'string'
                              },
                              {
                                prim: 'bytes'
                              }
                            ]
                          },
                          {
                            prim: 'string'
                          }
                        ]
                      }
                    ],
                    annots: ['%claims']
                  },
                  {
                    prim: 'string',
                    annots: ['%contract_type']
                  }
                ]
              },
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'big_map',
                    args: [
                      {
                        prim: 'string'
                      },
                      {
                        prim: 'bytes'
                      }
                    ],
                    annots: ['%metadata']
                  },
                  {
                    prim: 'address',
                    annots: ['%owner']
                  }
                ]
              }
            ]
          },
          {
            prim: 'Pair',
            args: [
              {
                prim: 'Pair',
                args: [
                  [
                    {
                      prim: 'Pair',
                      args: [
                        {
                          prim: 'Pair',
                          args: [
                            {
                              string:
                                'kepler://zCT5htke6GpMAeQ1R5fZ1bcAkkLhCz2YG7b1VhkfMuhFa5kvNweq/zb38SMzU4zF4iqrv2JhtZSc1a8hxDj9jbCUsRPsFc3nX1Z3UB'
                            },
                            {
                              bytes:
                                'de5cb6f72b6d080d9c9782090f3780f0977c3b53e09a2ea1b6e5662b7b392528'
                            }
                          ]
                        },
                        {
                          string: 'VerifiableCredential'
                        }
                      ]
                    }
                  ],
                  {
                    string: 'tzprofiles'
                  }
                ]
              },
              {
                prim: 'Pair',
                args: [
                  [
                    {
                      prim: 'Elt',
                      args: [
                        {
                          string: ''
                        },
                        {
                          bytes:
                            '68747470733a2f2f747a70726f66696c65732e636f6d2f747a69703031365f6d657461646174612e6a736f6e'
                        }
                      ]
                    }
                  ],
                  {
                    string: 'tz1erCQMmRgZHYm2uLuksDk85Rj7Md5symaC'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'mutez'
          },
          {
            int: '0'
          }
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'option',
            args: [
              {
                prim: 'key_hash'
              }
            ]
          },
          {
            prim: 'None'
          }
        ]
      },
      {
        prim: 'CREATE_CONTRACT',
        args: [
          {
            prim: 'parameter',
            args: [
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'list',
                    args: [
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'string'
                              },
                              {
                                prim: 'bytes'
                              }
                            ]
                          },
                          {
                            prim: 'string'
                          }
                        ]
                      }
                    ]
                  },
                  {
                    prim: 'bool'
                  }
                ]
              }
            ]
          },
          {
            prim: 'storage',
            args: [
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'set',
                        args: [
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'pair',
                                args: [
                                  {
                                    prim: 'string'
                                  },
                                  {
                                    prim: 'bytes'
                                  }
                                ]
                              },
                              {
                                prim: 'string'
                              }
                            ]
                          }
                        ],
                        annots: ['%claims']
                      },
                      {
                        prim: 'string',
                        annots: ['%contract_type']
                      }
                    ]
                  },
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'big_map',
                        args: [
                          {
                            prim: 'string'
                          },
                          {
                            prim: 'bytes'
                          }
                        ],
                        annots: ['%metadata']
                      },
                      {
                        prim: 'address',
                        annots: ['%owner']
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            prim: 'code',
            args: [
              [
                {
                  prim: 'UNPAIR'
                },
                {
                  prim: 'SWAP'
                },
                {
                  prim: 'DUP'
                },
                {
                  prim: 'DUG',
                  args: [
                    {
                      int: '2'
                    }
                  ]
                },
                {
                  prim: 'CDR'
                },
                {
                  prim: 'CDR'
                },
                {
                  prim: 'SENDER'
                },
                {
                  prim: 'COMPARE'
                },
                {
                  prim: 'NEQ'
                },
                {
                  prim: 'IF',
                  args: [
                    [
                      {
                        prim: 'PUSH',
                        args: [
                          {
                            prim: 'string'
                          },
                          {
                            string: 'Unauthorized.'
                          }
                        ]
                      },
                      {
                        prim: 'FAILWITH'
                      }
                    ],
                    []
                  ]
                },
                {
                  prim: 'PUSH',
                  args: [
                    {
                      prim: 'mutez'
                    },
                    {
                      int: '0'
                    }
                  ]
                },
                {
                  prim: 'AMOUNT'
                },
                {
                  prim: 'COMPARE'
                },
                {
                  prim: 'GT'
                },
                {
                  prim: 'IF',
                  args: [
                    [
                      {
                        prim: 'PUSH',
                        args: [
                          {
                            prim: 'string'
                          },
                          {
                            string: 'Tez not accepted.'
                          }
                        ]
                      },
                      {
                        prim: 'FAILWITH'
                      }
                    ],
                    []
                  ]
                },
                {
                  prim: 'UNPAIR'
                },
                {
                  prim: 'DUP',
                  args: [
                    {
                      int: '3'
                    }
                  ]
                },
                {
                  prim: 'CDR'
                },
                {
                  prim: 'CDR'
                },
                {
                  prim: 'DUP',
                  args: [
                    {
                      int: '4'
                    }
                  ]
                },
                {
                  prim: 'CDR'
                },
                {
                  prim: 'CAR'
                },
                {
                  prim: 'PAIR'
                },
                {
                  prim: 'DUP',
                  args: [
                    {
                      int: '4'
                    }
                  ]
                },
                {
                  prim: 'CAR'
                },
                {
                  prim: 'CDR'
                },
                {
                  prim: 'DIG',
                  args: [
                    {
                      int: '4'
                    }
                  ]
                },
                {
                  prim: 'CAR'
                },
                {
                  prim: 'CAR'
                },
                {
                  prim: 'DIG',
                  args: [
                    {
                      int: '3'
                    }
                  ]
                },
                {
                  prim: 'ITER',
                  args: [
                    [
                      {
                        prim: 'SWAP'
                      },
                      {
                        prim: 'DUP',
                        args: [
                          {
                            int: '5'
                          }
                        ]
                      },
                      {
                        prim: 'DIG',
                        args: [
                          {
                            int: '2'
                          }
                        ]
                      },
                      {
                        prim: 'UPDATE'
                      }
                    ]
                  ]
                },
                {
                  prim: 'DIG',
                  args: [
                    {
                      int: '3'
                    }
                  ]
                },
                {
                  prim: 'DROP'
                },
                {
                  prim: 'PAIR'
                },
                {
                  prim: 'PAIR'
                },
                {
                  prim: 'NIL',
                  args: [
                    {
                      prim: 'operation'
                    }
                  ]
                },
                {
                  prim: 'PAIR'
                }
              ]
            ]
          }
        ]
      },
      {
        prim: 'SWAP'
      },
      {
        prim: 'DROP'
      },
      {
        prim: 'CONS'
      }
    ]
    expect(await lambdaOfOperations(input, 'https://mainnet.api.tez.ie')).to.deep.equals(output)
  })

  it('on multiple transactions', async () => {
    const input: Operation[] = [
      {
        kind: 'transaction',
        source: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT',
        fee: '559',
        counter: '957115',
        gas_limit: '1808',
        storage_limit: '1',
        amount: '0',
        destination: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o',
        parameters: {
          entrypoint: 'update_operators',
          value: [
            {
              prim: 'Left',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          string: 'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm'
                        },
                        {
                          int: '0'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      {
        kind: 'transaction',
        source: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT',
        fee: '1809',
        counter: '957116',
        gas_limit: '14310',
        storage_limit: '0',
        amount: '0',
        destination: 'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm',
        parameters: {
          entrypoint: 'cashToToken',
          value: {
            prim: 'Pair',
            args: [
              {
                string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
              },
              {
                prim: 'Pair',
                args: [
                  {
                    int: '9990245406'
                  },
                  {
                    prim: 'Pair',
                    args: [
                      {
                        int: '10000'
                      },
                      {
                        string: '2022-08-30T14:22:53.112Z'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        kind: 'transaction',
        source: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT',
        fee: '556',
        counter: '957117',
        gas_limit: '1778',
        storage_limit: '0',
        amount: '0',
        destination: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o',
        parameters: {
          entrypoint: 'update_operators',
          value: [
            {
              prim: 'Right',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          string: 'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm'
                        },
                        {
                          int: '0'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    ]

    const output = [
      {
        prim: 'DROP'
      },
      {
        prim: 'NIL',
        args: [
          {
            prim: 'operation'
          }
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'address'
          },
          {
            string: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o%update_operators'
          }
        ]
      },
      {
        prim: 'CONTRACT',
        args: [
          {
            prim: 'list',
            args: [
              {
                prim: 'or',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'address',
                        annots: ['%owner']
                      },
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'address',
                            annots: ['%operator']
                          },
                          {
                            prim: 'nat',
                            annots: ['%token_id']
                          }
                        ]
                      }
                    ],
                    annots: ['%add_operator']
                  },
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'address',
                        annots: ['%owner']
                      },
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'address',
                            annots: ['%operator']
                          },
                          {
                            prim: 'nat',
                            annots: ['%token_id']
                          }
                        ]
                      }
                    ],
                    annots: ['%remove_operator']
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        prim: 'IF_NONE',
        args: [
          [
            {
              prim: 'UNIT'
            },
            {
              prim: 'FAILWITH'
            }
          ],
          [
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'mutez'
                },
                {
                  int: '0'
                }
              ]
            },
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'list',
                  args: [
                    {
                      prim: 'or',
                      args: [
                        {
                          prim: 'pair',
                          args: [
                            {
                              prim: 'address',
                              annots: ['%owner']
                            },
                            {
                              prim: 'pair',
                              args: [
                                {
                                  prim: 'address',
                                  annots: ['%operator']
                                },
                                {
                                  prim: 'nat',
                                  annots: ['%token_id']
                                }
                              ]
                            }
                          ],
                          annots: ['%add_operator']
                        },
                        {
                          prim: 'pair',
                          args: [
                            {
                              prim: 'address',
                              annots: ['%owner']
                            },
                            {
                              prim: 'pair',
                              args: [
                                {
                                  prim: 'address',
                                  annots: ['%operator']
                                },
                                {
                                  prim: 'nat',
                                  annots: ['%token_id']
                                }
                              ]
                            }
                          ],
                          annots: ['%remove_operator']
                        }
                      ]
                    }
                  ]
                },
                [
                  {
                    prim: 'Left',
                    args: [
                      {
                        prim: 'Pair',
                        args: [
                          {
                            string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
                          },
                          {
                            prim: 'Pair',
                            args: [
                              {
                                string: 'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm'
                              },
                              {
                                int: '0'
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              ]
            },
            {
              prim: 'TRANSFER_TOKENS'
            },
            {
              prim: 'CONS'
            }
          ]
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'address'
          },
          {
            string: 'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm%cashToToken'
          }
        ]
      },
      {
        prim: 'CONTRACT',
        args: [
          {
            prim: 'pair',
            args: [
              {
                prim: 'address',
                annots: ['%to']
              },
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'nat',
                    annots: ['%minTokensBought']
                  },
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'nat',
                        annots: ['%cashSold']
                      },
                      {
                        prim: 'timestamp',
                        annots: ['%deadline']
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        prim: 'IF_NONE',
        args: [
          [
            {
              prim: 'UNIT'
            },
            {
              prim: 'FAILWITH'
            }
          ],
          [
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'mutez'
                },
                {
                  int: '0'
                }
              ]
            },
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'pair',
                  args: [
                    {
                      prim: 'address',
                      annots: ['%to']
                    },
                    {
                      prim: 'pair',
                      args: [
                        {
                          prim: 'nat',
                          annots: ['%minTokensBought']
                        },
                        {
                          prim: 'pair',
                          args: [
                            {
                              prim: 'nat',
                              annots: ['%cashSold']
                            },
                            {
                              prim: 'timestamp',
                              annots: ['%deadline']
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  prim: 'Pair',
                  args: [
                    {
                      string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          int: '9990245406'
                        },
                        {
                          prim: 'Pair',
                          args: [
                            {
                              int: '10000'
                            },
                            {
                              string: '2022-08-30T14:22:53.112Z'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              prim: 'TRANSFER_TOKENS'
            },
            {
              prim: 'CONS'
            }
          ]
        ]
      },
      {
        prim: 'PUSH',
        args: [
          {
            prim: 'address'
          },
          {
            string: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o%update_operators'
          }
        ]
      },
      {
        prim: 'CONTRACT',
        args: [
          {
            prim: 'list',
            args: [
              {
                prim: 'or',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'address',
                        annots: ['%owner']
                      },
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'address',
                            annots: ['%operator']
                          },
                          {
                            prim: 'nat',
                            annots: ['%token_id']
                          }
                        ]
                      }
                    ],
                    annots: ['%add_operator']
                  },
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'address',
                        annots: ['%owner']
                      },
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'address',
                            annots: ['%operator']
                          },
                          {
                            prim: 'nat',
                            annots: ['%token_id']
                          }
                        ]
                      }
                    ],
                    annots: ['%remove_operator']
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        prim: 'IF_NONE',
        args: [
          [
            {
              prim: 'UNIT'
            },
            {
              prim: 'FAILWITH'
            }
          ],
          [
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'mutez'
                },
                {
                  int: '0'
                }
              ]
            },
            {
              prim: 'PUSH',
              args: [
                {
                  prim: 'list',
                  args: [
                    {
                      prim: 'or',
                      args: [
                        {
                          prim: 'pair',
                          args: [
                            {
                              prim: 'address',
                              annots: ['%owner']
                            },
                            {
                              prim: 'pair',
                              args: [
                                {
                                  prim: 'address',
                                  annots: ['%operator']
                                },
                                {
                                  prim: 'nat',
                                  annots: ['%token_id']
                                }
                              ]
                            }
                          ],
                          annots: ['%add_operator']
                        },
                        {
                          prim: 'pair',
                          args: [
                            {
                              prim: 'address',
                              annots: ['%owner']
                            },
                            {
                              prim: 'pair',
                              args: [
                                {
                                  prim: 'address',
                                  annots: ['%operator']
                                },
                                {
                                  prim: 'nat',
                                  annots: ['%token_id']
                                }
                              ]
                            }
                          ],
                          annots: ['%remove_operator']
                        }
                      ]
                    }
                  ]
                },
                [
                  {
                    prim: 'Right',
                    args: [
                      {
                        prim: 'Pair',
                        args: [
                          {
                            string: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT'
                          },
                          {
                            prim: 'Pair',
                            args: [
                              {
                                string: 'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm'
                              },
                              {
                                int: '0'
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              ]
            },
            {
              prim: 'TRANSFER_TOKENS'
            },
            {
              prim: 'CONS'
            }
          ]
        ]
      }
    ]
    expect(await lambdaOfOperations(input, 'https://mainnet.api.tez.ie')).to.deep.equals(output)
  })
})
