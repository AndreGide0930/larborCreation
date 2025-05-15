package com.example.demo2.controller;
import com.aliyun.oss.ClientBuilderConfiguration;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.common.comm.SignVersion;
import com.aliyun.oss.model.*;
import com.example.demo2.entity.*;
import com.example.demo2.entity.dto.WorksUploadInput;
import com.example.demo2.factory.impl.AliOSSFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.JSqlClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.http.HttpHeaders;
import java.io.*;
import java.net.URLEncoder;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import static com.example.demo2.Demo2Application.logger;

@Api
@RestController
public class WorksController {
    private final JSqlClient sqlClient;
    private final CreationTable table = CreationTable.$;
//    private final CreationRepository creationRepository;
    String endpoint = "oss-cn-chengdu.aliyuncs.com";
    String bucketName = "labor-creation";
    String region = "cn-chengdu";
    public WorksController(JSqlClient sqlClient) {
        this.sqlClient = sqlClient;
    }
//    String callbackUrl = "http://localhost:8080";

    //create
    @Api
    @Deprecated
    @PostMapping("/createWorks/{pkUserinfo}")
    public Creation createWorksWithPkUserInfo(@RequestBody Creation creation,@PathVariable long pkUserinfo) {
        Creation creation1 = CreationDraft.$.produce(creation,draft -> {
            draft.setCName(creation.cName());
            draft.setCType(CreationTypeENUM.DONE);
            draft.fkUserInfo().setPkUserInfo(pkUserinfo);
        });
        return sqlClient.save(creation1).getModifiedEntity();
    }
    //create
    @Api
    @Deprecated
    @PostMapping("/createWorks")
    public Creation createWorks(@RequestBody Creation creation) {
        return sqlClient.save(creation).getModifiedEntity();
    }
    //readOne
    @Api
    @GetMapping("/oneWorks")
    public Creation detailOfWorks(long pkCreation){
        try {
            //execute查询为空并不为异常
            //fetchOne 要求有且仅有 1 个
            return sqlClient.createQuery(table)
                    .where(table.cType().eq(CreationTypeENUM.DONE))
                    .where(table.pkCreation().eq(pkCreation))
                    .select(table)
                    .fetchOne();
        }catch (Exception e){
            e.printStackTrace();
            throw new RuntimeException("ID有误 或 该不为'作品'类别\n"+ e);
        }
    }
    //readAll
    @Api
    @GetMapping("/readAllWorksById")
    public List<Creation> readWorks(@RequestParam Long pkUserInfo) {
        if (pkUserInfo == null) {
            throw new IllegalArgumentException("pkUserInfo参数不能为空");
        }
        try {
            return sqlClient.createQuery(table)
                    //换一种方式尝试
                    .where(table.fkUserInfo().pkUserInfo().eq(pkUserInfo))
                    .where(table.cType().eq(CreationTypeENUM.DONE))
//                    .groupBy(table.cType().eq(TypeENUM.Done))
                    .select(table)
                    .execute();
        }
        catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }

    @PostMapping(value = "/worksUpload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Creation uploadWithFile(
            @RequestPart("file") MultipartFile file,
            @RequestPart("input") String inputJson // 改成 String 接 JSON 字符串
    ) throws Exception {

        logger.info("Received creation input JSON: {}", inputJson);

        // 用 ObjectMapper 解析 JSON
        ObjectMapper objectMapper = new ObjectMapper();
        WorksUploadInput input = objectMapper.readValue(inputJson, WorksUploadInput.class);

        // 上传文件
        String originalFilename = file.getOriginalFilename();
        String ossFileName = generateOSSFileName(originalFilename);
        String ossUrl = uploadToOSS(file, ossFileName);

        // 处理用户字段
        UserInfo userInfo = UserInfoDraft.$.produce(userDraft ->
                userDraft.setPkUserInfo(input.getFkUserInfo().getPkUserInfo())
        );

        // 构造 Creation
        Creation savedCreation = CreationDraft.$.produce(draft -> {
            draft.setFkUserInfo(userInfo);
            draft.setCWeight(input.getCWeight());
            draft.setCPriority(input.getCPriority());
            draft.setCSynopsis(input.getCSynopsis());
            draft.setCName(ossFileName);
            draft.setCUrl(ossUrl);
            draft.setCType(CreationTypeENUM.DONE);
        });

        return sqlClient.insert(savedCreation).getModifiedEntity();
    }

    private String uploadToOSS(MultipartFile file, String ossFileName) throws Exception {
        OSS ossClient = new AliOSSFactory(endpoint, bucketName, region).createClient();
        try {
            // 设置Content-Type（重要！）
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(resolveContentType(file.getOriginalFilename()));

            PutObjectRequest putRequest = new PutObjectRequest(
                    bucketName,
                    ossFileName,
                    file.getInputStream(),
                    metadata
            );

            ossClient.putObject(putRequest);
            return String.format("https://%s.%s/%s", bucketName, endpoint, ossFileName);
        } finally {
            ossClient.shutdown();
        }
    }

    private String generateOSSFileName(String originalFilename) {
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        return UUID.randomUUID().toString() + extension;
    }


    //streamDownload
    @Api
    @GetMapping("/preview")
    public ResponseEntity<StreamingResponseBody> previewFile(
            @RequestParam long pkCreation) {

        // 1. 查询数据库获取文件信息
        Creation creation = sqlClient.createQuery(table)
                .where(table.pkCreation().eq(pkCreation))
                .select(table)
                .fetchOne();
        if (creation == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "文件不存在");
        }

        // 2. 创建OSS客户端
        OSS ossClient = new AliOSSFactory(endpoint, bucketName, region).createClient();
        try {
            // 3. 获取OSS文件对象
            OSSObject ossObject = ossClient.getObject(bucketName, creation.cName());

            // 4. 动态识别内容类型（优先使用OSS元数据）
            String contentType = Optional.ofNullable(ossObject.getObjectMetadata().getContentType())
                    .orElseGet(() -> resolveContentType(creation.cName()));

            // 5. 构建流式响应
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + URLEncoder.encode(creation.cName(), "UTF-8") + "\"")
                    .body(outputStream -> {
                        try (InputStream is = ossObject.getObjectContent()) {
                            is.transferTo(outputStream);
                        } finally {
                            ossObject.close();
                        }
                    });

        } catch (OSSException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OSS服务异常");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "预览失败");
        } finally {
            ossClient.shutdown();
        }
    }
    @Api
    @GetMapping("/fileDownload")
    public void fileDownload(
            @RequestParam long pkCreation,
            @RequestParam String downLoadPath
    ) {
        // 创建OSSClient实例。
        ClientBuilderConfiguration clientBuilderConfiguration = new ClientBuilderConfiguration();
        clientBuilderConfiguration.setSignatureVersion(SignVersion.V4);
//        OSS ossClient = OSSClientBuilder.create()
//                .endpoint(endpoint)
//                .credentialsProvider(credentialsProvider)
//                .clientConfiguration(clientBuilderConfiguration)
//                .region(region)
//                .build();
        OSS ossClient = new AliOSSFactory(endpoint, bucketName, region).createClient();


        try {
            Creation creation = sqlClient.createQuery(table)
                    .where(table.pkCreation().eq(pkCreation))
                    .select(table)
                    .fetchOne();
            // 下载Object到本地文件，并保存到指定的本地路径中。如果指定的本地文件存在会覆盖，不存在则新建。
            // 如果未指定本地路径，则下载后的文件默认保存到示例程序所属项目对应本地路径中。
            ossClient.getObject(new GetObjectRequest(bucketName, creation.cName()), new File(downLoadPath));
        } catch (OSSException oe) {
            System.out.println("Caught an OSSException, which means your request made it to OSS, "
                    + "but was rejected with an error response for some reason.");
            System.out.println("Error Message:" + oe.getErrorMessage());
            System.out.println("Error Code:" + oe.getErrorCode());
            System.out.println("Request ID:" + oe.getRequestId());
            System.out.println("Host ID:" + oe.getHostId());
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }

    //     根据文件名解析MIME类型
    private String resolveContentType(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "mp4" -> "video/mp4";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default -> MediaType.APPLICATION_OCTET_STREAM_VALUE;
        };
    }
}
