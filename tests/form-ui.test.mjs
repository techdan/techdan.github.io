import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { sendInquiry } from '../src/contact.js';

const source = (await readFile(new URL('../src/main.js', import.meta.url), 'utf8')).replace("import { sendInquiry } from './contact.js';", '');
function harness(fetchImpl) {
  class Field {
    constructor(value) { this.value = value; this.validationMessage = ''; }
    setCustomValidity(message) { this.validationMessage = message; }
  }
  const listeners = {};
  const fields = {name:new Field('Form check'), firm:new Field('Example'), email:new Field('test@example.com'), message:new Field('A general technical inquiry.'), _gotcha:new Field('')};
  const button = {disabled:false};
  const status = {textContent:'',dataset:{}};
  let resets = 0;
  const form = {
    addEventListener: (event, callback) => { listeners[event] = callback; },
    querySelector: () => button,
    reportValidity: () => !Object.values(fields).some(field => field.validationMessage),
    setAttribute() {}, removeAttribute() {},
    reset() { resets++; Object.values(fields).forEach(field => { field.value = ''; }); },
  };
  const elements = {...fields, 'contact-form':form, 'form-status':status, 'submit-label':{textContent:''}, year:{textContent:''}};
  class TestFormData extends FormData {
    constructor() { super(); Object.entries(fields).forEach(([name,field]) => this.set(name,field.value)); }
  }
  const context = {document:{getElementById:id=>elements[id]}, HTMLInputElement:Field, HTMLTextAreaElement:Field, FormData:TestFormData, AbortController, Date, window:{setTimeout:()=>1,clearTimeout(){},requestIdleCallback(){}}, sendInquiry:(data,options)=>sendInquiry(data,{...options,fetchImpl})};
  vm.runInNewContext(source, context);
  return {fields,button,status,submit:()=>listeners.submit({preventDefault(){}}),resets:()=>resets};
}

test('a rejected inquiry retains the message, displays an error, and re-enables submission', async () => {
  const ui = harness(async()=>({ok:false,status:503}));
  await ui.submit();
  assert.equal(ui.fields.message.value,'A general technical inquiry.');
  assert.equal(ui.resets(),0);
  assert.equal(ui.status.dataset.state,'error');
  assert.equal(ui.button.disabled,false);
});
test('confirmed provider acceptance clears the form and shows success', async () => {
  const ui = harness(async()=>({ok:true,status:200}));
  await ui.submit();
  assert.equal(ui.resets(),1);
  assert.equal(ui.status.dataset.state,'success');
  assert.equal(ui.button.disabled,false);
});
test('repeated submit events cannot send a duplicate while a request is pending', async () => {
  let resolveRequest, calls=0;
  const ui=harness(()=>{calls++; return new Promise(resolve=>{resolveRequest=resolve;});});
  const first=ui.submit();
  assert.equal(ui.button.disabled,true);
  await ui.submit();
  assert.equal(calls,1);
  resolveRequest({ok:true,status:200});
  await first;
});
test('whitespace-only messages do not reach the provider', async () => {
  let calls=0;
  const ui=harness(async()=>{calls++; return {ok:true};});
  ui.fields.message.value='   ';
  await ui.submit();
  assert.equal(calls,0);
  assert.match(ui.fields.message.validationMessage,/fill in/);
});
test('filled honeypots do not reach the provider', async () => {
  let calls=0;
  const ui=harness(async()=>{calls++; return {ok:true};});
  ui.fields._gotcha.value='bot content';
  await ui.submit();
  assert.equal(calls,0);
});
