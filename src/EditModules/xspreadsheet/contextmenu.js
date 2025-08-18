import { h } from './element';
import { bindClickoutside, unbindClickoutside } from './event';
import { cssPrefix } from '../config';
import { tf } from '../locale/locale';

const menuItems = [
  { key: 'copy', title: tf('contextmenu.copy'), label: 'Ctrl+C' },
  { key: 'cut', title: tf('contextmenu.cut'), label: 'Ctrl+X' },
  { key: 'paste', title: tf('contextmenu.paste'), label: 'Ctrl+V' },
  { key: 'paste-value', title: tf('contextmenu.pasteValue'), label: 'Ctrl+Shift+V' },
  { key: 'paste-format', title: tf('contextmenu.pasteFormat'), label: 'Ctrl+Alt+V' },
  { key: 'divider' },
  { key: 'insert-row', title: tf('contextmenu.insertRow') },
  { key: 'insert-column', title: tf('contextmenu.insertColumn') },
  { key: 'divider' },
  { key: 'delete-row', title: tf('contextmenu.deleteRow') },
  { key: 'delete-column', title: tf('contextmenu.deleteColumn') },
  { key: 'delete-cell-text', title: tf('contextmenu.deleteCellText') },
  { key: 'hide', title: tf('contextmenu.hide') },
  { key: 'divider' },
  { key: 'validation', title: tf('contextmenu.validation') },
  { key: 'divider' },
  { key: 'cell-printable', title: tf('contextmenu.cellprintable') },
  { key: 'cell-non-printable', title: tf('contextmenu.cellnonprintable') },
  { key: 'divider' },
  { key: 'cell-editable', title: tf('contextmenu.celleditable') },
  { key: 'cell-non-editable', title: tf('contextmenu.cellnoneditable') },
  { key: 'updateload', title: tf('contextmenu.UpDateload')},
];

function buildMenuItem(item) {
  if (item.key === 'divider') {
    return h('div', `${cssPrefix}-item divider`);
  }
  return h('div', `${cssPrefix}-item`)
    .on('click', () => {
      this.itemClick(item.key);
      this.hide();
    })
    .children(
      item.title(),
      h('div', 'label').child(item.label || ''),
    );
}

function buildMenu() {
  return menuItems.map(it => buildMenuItem.call(this, it));
}

export default class ContextMenu {
  constructor(viewFn, isHide = false) {
    this.menuItems = buildMenu.call(this);
    this.el = h('div', `${cssPrefix}-contextmenu`)
      .children(...this.menuItems)
      .hide();
    this.viewFn = viewFn;
    this.itemClick = () => {};
    this.isHide = isHide;
    this.setMode('range');
  }

  // row-col: the whole rows or the whole cols
  // range: select range
  setMode(mode) {
    const hideEl = this.menuItems[12];
    if (mode === 'row-col') {
      hideEl.show();
    } else {
      hideEl.hide();
    }
  }

  hide() {
    const { el } = this;
    el.hide();
    unbindClickoutside(el);
  }
  setPosition(x, y, targetEl) {
    if (this.isHide) return;
    const { el } = this;
    const { width, height } = el.show().offset();
  
    const view = this.viewFn();
    const viewportWidth = view.width;
    const viewportHeight = view.height;
  
    // 如果有傳入 targetEl，使用該元素的位置信息做基準
    let left = x;
    let top = y;
  
    // 預設以傳入座標為基準，可改為 targetEl 距離視窗左上角的座標
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      left = rect.right;  // 右邊緣，選單往右靠
      top = rect.top;
    }
  
    // 防止選單超出右邊界，右移調整
    if (left + width > viewportWidth) {
      left = Math.max(0, left - width - (targetEl ? targetEl.offsetWidth : 0));
    }
  
    // 防止選單超出底部，往上方彈出
    if (top + height > viewportHeight) {
      top = Math.max(0, viewportHeight - height);
    }
  
    el.css('left', `${left}px`)
      .css('top', `${top}px`)
      .css('bottom', 'auto')
      .css('max-height', `${viewportHeight - top}px`);
  
    bindClickoutside(el);
  }
  
  // setPosition(x, y) {
  //   if (this.isHide) return;
  //   const { el } = this;
  //   const { width } = el.show().offset();
  //   const view = this.viewFn();
  //   const vhf = view.height / 2;
  //   let left = x;
  //   if (view.width - x <= width) {
  //     left -= width;
  //   }
  //   el.css('left', `${left}px`);
  //   if (y > vhf) {
  //     el.css('bottom', `${view.height - y}px`)
  //       .css('max-height', `${y}px`)
  //       .css('top', 'auto');
  //   } else {
  //     el.css('top', `${y}px`)
  //       .css('max-height', `${view.height - y}px`)
  //       .css('bottom', 'auto');
  //   }
  //   bindClickoutside(el);
  // }
}
