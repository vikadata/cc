import React, { useEffect, useState } from "react";
import {
  initializeWidget,
  useActiveViewId,
  useCloudStorage,
  useFields,
  useRecords,
  useRecordsAll,
} from "@vikadata/widget-sdk";
import { Button, ButtonGroup, Checkbox, TextInput } from "@vikadata/components";
import Vika, { ICreateRecordsReqParams, IField, IRecord } from "@vikadata/vika";
import { MyRecord, calcSQC, MyResult } from "./calc";
import { chunk } from "lodash";

const SqcCalc: React.FC = () => {
  const [token, setToken] = useCloudStorage<string>("token", "");
  const [targetDstId, setTargetDstId] = useCloudStorage<string>(
    "targetDstId",
    ""
  );
  const [targetDstFields, setTargetDstFields] = useState<IField[]>([]);
  const [targetDstFieldId, setTargetDstFieldId] = useCloudStorage<string>("");
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [locked, setLocked] = useState<boolean>(false);
  const viewId = useActiveViewId();
  const fields = useFields(viewId);
  const records = useRecords(viewId);

  const targetDstIdUpdated = async () => {
    if (!targetDstId) {
      return;
    }
    if (token) {
      setError("");
      const vika = new Vika({ token });
      const dst = vika.datasheet(targetDstId);
      const resp = await dst.fields.list();
      if (resp.success) {
        setTargetDstFields(resp.data.fields);
      } else {
        console.log("fetch field list error", resp);
        setError("获取计算器输出结果表格失败：" + resp.message);
      }
    } else {
      setError("API Token 为空");
    }
  };

  useEffect(() => {
    targetDstIdUpdated();
  }, [targetDstId, token]);

  useEffect(() => {
    if (
      targetDstFields.length &&
      !targetDstFields.some((field) => field.id === targetDstFieldId)
    ) {
      setTargetDstFieldId(targetDstFields[0].id);
    }
  }, [targetDstFields]);

  const updateTargetRecords = async (result: MyResult) => {
    console.log('>>>>>>>>>>>>>>', targetDstFields, targetDstFieldId);
    const vika = new Vika({ token });
    const targetRecords: IRecord[] = [];
    for await (const records of vika
      .datasheet(targetDstId)
      .records.queryAll({ fieldKey: "id" })) {
      targetRecords.push(...records);
    }
    const toCreateRecords: ICreateRecordsReqParams = [];
    const toUpdateRecords: IRecord[] = [];
    for (const resultId in result) {
      const values = result[resultId]!;
      const targetRecord = targetRecords.find(
        (record) => record.fields[targetDstFieldId] === resultId
      );
      if (targetRecord) {
        toUpdateRecords.push({
          recordId: targetRecord.recordId,
          fields: values,
        });
      } else {
        toCreateRecords.push({
          fields: {
            ...values,
            [targetDstFields.find((f) => f.id === targetDstFieldId)!.name]:
              resultId,
          },
        });
      }
    }
    if (toUpdateRecords.length) {
      for (const records of chunk(toUpdateRecords, 10)) {
        const resp = await vika.datasheet(targetDstId).records.update(records);
        if (!resp.success) {
          console.log("update result datasheet error", records, resp);
          setError("更新计算器结果失败：" + resp.message);
          return;
        }
      }
    }

    if (toCreateRecords.length) {
      for (const records of chunk(toCreateRecords, 10)) {
        const resp = await vika.datasheet(targetDstId).records.create(records);
        if (!resp.success) {
          console.log("insert result datasheet error", records, resp);
          setError("创建计算器结果失败：" + resp.message);
          return;
        }
      }
    }

    setInfo("计算完成");
  };

  const calc = async () => {
    setLocked(true);
    if (!targetDstFields.length) {
      setInfo("正在获取计算器结果表格...");
      await targetDstIdUpdated();
      setInfo("");
    }
    if (!error) {
      setInfo("正在计算参数...");
      const srcRecords: MyRecord[] = [];
      await new Promise<void>((resolve) => {
        let remain = records.length;
        records.forEach((record, i) => {
          setTimeout(async () => {
            let rr = fields.length;
            const srcFields: { [name: string]: any } = {};
            await new Promise<void>((res) => {
              fields.forEach((field) => {
                setTimeout(() => {
                  const v = record.getCellValue(field.id);
                  if (v) {
                    srcFields[field.name] = v;
                  }
                  if (--rr <= 0) {
                    res();
                  }
                }, 0);
              });
            });
            srcRecords[i] = {
              id: record.id,
              fields: srcFields,
            };
            if (--remain <= 0) {
              resolve();
            }
          }, 0);
        });
      });
      setInfo("正在计算SQC...");
      const result = calcSQC(srcRecords);
      setInfo("正在更新计算结果表格...");
      await updateTargetRecords(result);
    }
    setLocked(false);
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flexGrow: 1, overflow: "auto", padding: "0 8px" }}>
        API Token
        <TextInput
          onChange={(e) => setToken(e.target.value)}
          value={token}
          disabled={locked}
        ></TextInput>
        计算器输出表格ID
        <TextInput
          onChange={(e) => setTargetDstId(e.target.value)}
          value={targetDstId}
          disabled={locked}
        ></TextInput>
        输出表格记录唯一标识字段：
        <ButtonGroup>
          {targetDstFields.map((field) => (
            <span style={{ paddingRight: "10px" }} key={field.id}>
              <Checkbox
                checked={targetDstFieldId === field.id}
                key={field.id}
                onChange={(e) => {
                  if (e) {
                    setTargetDstFieldId(field.id);
                  }
                }}
              >
                {field.name}
              </Checkbox>
            </span>
          ))}
        </ButtonGroup>
        <br />
        <br />
        <Button onClick={() => calc()} disabled={locked}>
          开始计算
        </Button>{" "}
        <span style={{ color: "red" }}>{error}</span>
        <br />
        {info}
      </div>
    </div>
  );
};

initializeWidget(SqcCalc, process.env.WIDGET_PACKAGE_ID!);
