// utils/message.js
import {message, Modal} from 'antd';

export function handleError(error) {
  // const errorText =
  //   typeof error === 'string'
  //     ? error
  //     : error?.message || 'Something went wrong';
  //
  // Modal.error({
  //   title: 'Oops!',
  //   content: errorText,
  //   centered: true,     // 可选：让它居中弹出
  //   width: 360,
  // });
    alert(error?.message); // 临时替代
  //   message.error(error.message || 'Something went wrong');
}
