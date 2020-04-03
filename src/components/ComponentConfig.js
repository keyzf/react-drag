import React, { useState } from 'react';
import { connect } from 'dva';
import { Input, Select, Button, Modal, Form, Collapse } from 'antd';
import _ from 'loadsh';
import { itemUpdateInfo, itemRemove, itemCopy } from '../utils/utils';
import Color from './picker';
const { Option } = Select;
const { Panel } = Collapse;

const Config = props => {
  const [visible, setVisible] = useState(false);
  const [showOrginzation, setShowOrginzation] = useState(false);
  const { config, currentView, dispatch, form, orgArr } = props;
  const { getFieldDecorator } = form;
  /**
   * @description 配置项的渲染组件
   * @param {*} data 该配置项的数据结构
   */
  const renderConfig = (data, type) => {
    if (JSON.stringify(data) !== '[]' && data) {
      return data.map((item, index) => {
        return (
          <Panel header={item.text} key={item.text}>
            <div key={index}>
              {/* <div>
              <h3>{item.text}</h3>
            </div> */}
              <div>
                {item.children.map((item, index) => {
                  return <div key={index}>{renderValue(item, type)}</div>;
                })}
              </div>
            </div>
          </Panel>
        );
      });
    }
  };

  /**
   * @description render函数，渲染配置项
   */
  const renderValue = (
    { text: title, field: value, type, data },
    propsType,
  ) => {
    let valueInfo =
      propsType === 'props' ? config.propsInfo : config.nodePropsInfo;
    if (propsType === 'props') {
      if (value.indexOf('.') != -1) {
        const valuearr = value.split('.');
        valuearr.map((item, index) => {
          if (index == valuearr.length - 1) {
            valueInfo = valueInfo[item];
          } else {
            valueInfo = valueInfo[item];
          }
        });
      } else {
        valueInfo = valueInfo[value];
      }
    } else {
      // reactnodeinofo;
      // 特殊处理,key,只有.的参数
      const valuearr = value.split('.');
      const key = valuearr[0];
      const params = valuearr[1];
      valueInfo = valueInfo[key].params[params];
    }
    if (type === 'string') {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{title}</span>
          <Input
            value={valueInfo}
            style={{ width: '50%' }}
            onChange={e => changeValueParent(propsType, e.target.value, value)}
          />
        </div>
      );
    }
    if (type === 'array') {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{title}</span>
          <Select
            defaultValue={valueInfo}
            style={{ width: '50%' }}
            onChange={v => {
              changeValueParent(propsType, v, value);
            }}
          >
            {data.map((item, index) => {
              return (
                <Select.Option value={item.value} key={index}>
                  {item.text}
                </Select.Option>
              );
            })}
          </Select>
        </div>
      );
    }
    if (type === 'color') {
      return (
        <div style={{ display: 'flex' }}>
          <span>{title}</span>
          <Color
            color={valueInfo}
            style={{ width: '50%' }}
            onChange={color => changeValueParent(propsType, color, value)}
          />
        </div>
      );
    }
    return <div>other</div>;
  };

  /**
   * @description change事件
   * @param {string} type 对应类型['props','reactNodeProps']
   * @param {string} key 所对应到的属性名称 e.g:props.content -> content
   */
  const changeValueParent = (type, targetValue, key) => {
    if (type === 'props') {
      return changeValue(targetValue, key);
    }
    if (type === 'reactNodeProps') {
      return changeReactNodeValue(targetValue, key);
    }
  };

  /**
   * @description 改变input配置项触发的函数(props)
   * @param {e} e event触发得到的e
   * @param {string} key 所对应到的属性名称 e.g:props.content -> content
   */
  const changeValue = (targetValue, key) => {
    const { dragItem, arrIndex, propsInfo } = config;
    let data = _.cloneDeep(propsInfo);
    let configInfo = data;
    if (key.indexOf('.') != -1) {
      const keyarr = key.split('.');
      keyarr.map((item, index) => {
        if (index == keyarr.length - 1) {
          configInfo[item] = targetValue;
        } else {
          configInfo = configInfo[item];
        }
      });
    } else {
      configInfo[key] = targetValue;
    }
    // setConfig
    dispatch({
      type: 'drag/saveConfig',
      payload: {
        propsInfo: data,
      },
    });

    dragItem.props = data;
    const newdata = itemUpdateInfo(
      arrIndex,
      _.cloneDeep(currentView),
      dragItem,
    );
    // setCurrentView
    dispatch({
      type: 'drag/setCurrentView',
      payload: newdata,
    });
  };

  /**
   * @description 改变input配置项触发的函数(nodeProps)
   * @param {e} e event触发得到的e
   * @param {string} key 所对应到的属性名称 e.g:props.content -> content
   */
  const changeReactNodeValue = (targetValue, key) => {
    // set reactinfo的key， 修改reactnode的key
    const { nodePropsInfo, dragItem, arrIndex } = config;

    let data = _.cloneDeep(nodePropsInfo);
    let configInfo = data;
    // 分解key
    const valuearr = key.split('.');
    const objkey = valuearr[0];
    const params = valuearr[1];
    // 赋值给config里对应的key
    configInfo[objkey].params[params] = targetValue;

    // setConfig
    dispatch({
      type: 'drag/saveConfig',
      payload: {
        nodePropsInfo: data,
      },
    });

    // 对应渲染到页面上
    dragItem.nodeProps = data;
    const newdata = itemUpdateInfo(
      arrIndex,
      _.cloneDeep(currentView),
      dragItem,
    );

    // setCurrentView
    dispatch({
      type: 'drag/setCurrentView',
      payload: newdata,
    });
  };

  /**
   * @description 删除组件
   */
  const RemoveComponent = () => {
    const newdata = itemRemove(config.arrIndex, _.cloneDeep(currentView));
    // 发送请求
    dispatch({
      type: 'drag/setCurrentView',
      payload: newdata,
    });
  };

  /**
   * @description 复制组件
   */
  const CopyComponent = () => {
    const newdata = itemCopy(
      config.arrIndex,
      _.cloneDeep(currentView),
      config.dragItem,
    );
    // 发送请求
    dispatch({
      type: 'drag/setCurrentView',
      payload: newdata,
    });
  };

  /**
   * @description 生成模版
   */
  const GenerateTemplate = () => {
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  /**
   * @description 提交表单
   * @param {*} e
   */
  const submitForm = e => {
    console.log('e', e);
    const {
      form: { validateFields },
    } = props;
    validateFields((err, value) => {
      if (!err) {
        let payload = {
          ...value,
          comCode: config.dragItem,
        };
        dispatch({
          type: 'drag/setTemplateList',
          payload,
        });
        hideModal();
      }
    });
  };

  const handleChange = value => {
    if (value === 'ORGINZATION') {
      setShowOrginzation(true);
    } else {
      setShowOrginzation(false);
    }
  };

  return (
    <div>
      <Button onClick={CopyComponent} icon="copy" size="small">
        复制组件
      </Button>
      <Button onClick={RemoveComponent} icon="delete" size="small">
        删除组件
      </Button>
      <Button onClick={GenerateTemplate} icon="edit" size="small">
        生成模版
      </Button>
      <Collapse defaultActiveKey={['样式','主题','文字内容']}>
        {renderConfig(config.propsConfig, 'props')}
        {renderConfig(config.nodePropsConfig, 'reactNodeProps')}
      </Collapse>
      <Modal
        width="50%"
        title="生成模版"
        visible={visible}
        onOk={submitForm}
        onCancel={hideModal}
        okText="确认"
        cancelText="取消"
      >
        <div>
          <Form labelCol={{ span: 4 }} wrapperCol={{ span: 14 }}>
            <Form.Item label="组件名称">
              {getFieldDecorator('comName', {
                rules: [{ required: true, message: '请输入组件名称' }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="组件状态">
              {getFieldDecorator('comStatus', {
                rules: [{ required: true, message: '请输入组件状态' }],
              })(
                <Select style={{ width: 120 }} onChange={handleChange}>
                  <Option value="PUBLIC">公开</Option>
                  <Option value="PERSONAL">个人</Option>
                  <Option value="ORGINZATION">组织</Option>
                </Select>,
              )}
            </Form.Item>
            {showOrginzation ? (
              <>
                <Form.Item label="所属组织">
                  {getFieldDecorator('comOrgArr', {
                    rules: [{ required: true, message: '请选择所属组织' }],
                  })(
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      placeholder="请选择组件所公开属于的组织"
                    >
                      {orgArr.map(item => (
                        <Option key={item}>{item}</Option>
                      ))}
                    </Select>,
                  )}
                </Form.Item>
              </>
            ) : null}
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default connect(({ drag, orginzation }) => ({
  config: drag.config,
  currentView: drag.currentView,
  orgArr: orginzation.orgArr,
}))(Form.create()(Config));